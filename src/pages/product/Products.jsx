"use client"

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Star, SlidersHorizontal, X } from "lucide-react";
import Header from "../../components/Header";
import axiosInstance from "../../services/axios";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [selectedTopLevelCategory, setSelectedTopLevelCategory] = useState(searchParams.get("topLevelCategory") || "")
  const [selectedSecondLevelCategory, setSelectedSecondLevelCategory] = useState(
    searchParams.get("secondLevelCategory") || "",
  )
  const [selectedBrands, setSelectedBrands] = useState([])
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [sortBy, setSortBy] = useState("popular")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedCategories, setExpandedCategories] = useState([])

  useEffect(() => {
    fetchCategories()
    fetchBrands()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [
    selectedTopLevelCategory,
    selectedSecondLevelCategory,
    selectedBrands,
    priceRange,
    sortBy,
    currentPage,
    searchParams,
  ])

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/categories")
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/brands")
      setBrands(response.data)
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      const searchQuery = searchParams.get("search")
      if (searchQuery) params.append("keyword", searchQuery)

      if (selectedTopLevelCategory) params.append("topLevelCategory", selectedTopLevelCategory)
      if (selectedSecondLevelCategory) params.append("secondLevelCategory", selectedSecondLevelCategory)
      if (selectedBrands.length > 0) params.append("brands", selectedBrands.join(","))
      params.append("minPrice", priceRange[0])
      params.append("maxPrice", priceRange[1])
      params.append("sort", sortBy)
      params.append("page", currentPage)
      params.append("limit", 12)

      const response = await axiosInstance.get(`/api/v1/products?${params.toString()}`)
      setProducts(response.data.products || response.data)
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleBrand = (brandId) => {
    setSelectedBrands((prev) => (prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]))
  }

  const handleCategoryClick = (category, level, parentName = null) => {
    if (level === 1) {
      // Level 1 category selected - clear level 2
      setSelectedTopLevelCategory(category.name)
      setSelectedSecondLevelCategory("")
      setSearchParams({ topLevelCategory: category.name })
    } else if (level === 2) {
      // Level 2 category selected - set both levels
      setSelectedTopLevelCategory(parentName)
      setSelectedSecondLevelCategory(category.name)
      setSearchParams({ topLevelCategory: parentName, secondLevelCategory: category.name })
    }
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedTopLevelCategory("")
    setSelectedSecondLevelCategory("")
    setSelectedBrands([])
    setPriceRange([0, 10000])
    setCurrentPage(1)
    setSearchParams({})
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => {
                  handleCategoryClick(category, 1)
                  if (category.children?.length > 0) {
                    toggleCategory(category.id)
                  }
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                  selectedTopLevelCategory === category.name && !selectedSecondLevelCategory
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{category.name}</span>
                {category.children?.length > 0 && (
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      expandedCategories.includes(category.id) ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>
              {category.children?.length > 0 && expandedCategories.includes(category.id) && (
                <div className="ml-4 mt-2 space-y-2">
                  {category.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleCategoryClick(child, 2, category.name)}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedSecondLevelCategory === child.name
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {(selectedTopLevelCategory || selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Active Filters</h3>
          <div className="space-y-2">
            {selectedTopLevelCategory && (
              <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                <span>
                  {selectedTopLevelCategory}
                  {selectedSecondLevelCategory && ` > ${selectedSecondLevelCategory}`}
                </span>
                <button
                  onClick={() => {
                    setSelectedTopLevelCategory("")
                    setSelectedSecondLevelCategory("")
                    setSearchParams({})
                  }}
                  className="hover:text-blue-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                <span>
                  ${priceRange[0]} - ${priceRange[1]}
                </span>
                <button onClick={() => setPriceRange([0, 10000])} className="hover:text-blue-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-4">
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Brands</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => toggleBrand(brand.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {searchParams.get("search") ? `Search results for "${searchParams.get("search")}"` : "All Products"}
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}></div>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <FilterSidebar />
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort and Results */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">{loading ? "Loading..." : `${products.length} products found`}</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="w-full h-64 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={product.images?.[0] || product.image || "/placeholder.svg?height=300&width=300"}
                          alt={product.title}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {product.discount && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.rating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">({product.reviewCount || 0})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-blue-600">
                              ${product.minPrice || product.price}
                              {product.maxPrice && product.maxPrice !== product.minPrice && (
                                <span className="text-sm text-gray-500"> - ${product.maxPrice}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === i + 1 ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
