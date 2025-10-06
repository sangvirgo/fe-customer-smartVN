import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Star, SlidersHorizontal, X } from "lucide-react";
import axiosInstance from "../../services/axios";
import { showToast } from "../../components/Toast";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedTopLevelCategory, setSelectedTopLevelCategory] = useState(
    searchParams.get("topLevelCategory") || ""
  );
  const [selectedSecondLevelCategory, setSelectedSecondLevelCategory] = useState(
    searchParams.get("secondLevelCategory") || ""
  );
  const [priceRange, setPriceRange] = useState([0, 100000000]); // VND range
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    selectedTopLevelCategory,
    selectedSecondLevelCategory,
    priceRange,
    currentPage,
    searchParams,
  ]);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/categories");
      const categoriesData = response.data?.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const searchQuery = searchParams.get("search");
      if (searchQuery) params.append("keyword", searchQuery);

      if (selectedTopLevelCategory) {
        params.append("topLevelCategory", selectedTopLevelCategory);
      }
      if (selectedSecondLevelCategory) {
        params.append("secondLevelCategory", selectedSecondLevelCategory);
      }

      if (priceRange[0] > 0) params.append("minPrice", priceRange[0]);
      if (priceRange[1] < 100000000) params.append("maxPrice", priceRange[1]);

      params.append("page", currentPage);
      params.append("size", 12);

      const response = await axiosInstance.get(`/products?${params.toString()}`);

      const pageData = response.data?.data || {};
      setProducts(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast(error.message || "Failed to fetch products", "error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (category, level, parentName = null) => {
    if (level === 1) {
      setSelectedTopLevelCategory(category.name);
      setSelectedSecondLevelCategory("");
      setSearchParams({ topLevelCategory: category.name });
    } else if (level === 2) {
      setSelectedTopLevelCategory(parentName);
      setSelectedSecondLevelCategory(category.name);
      setSearchParams({
        topLevelCategory: parentName,
        secondLevelCategory: category.name,
      });
    }
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSelectedTopLevelCategory("");
    setSelectedSecondLevelCategory("");
    setPriceRange([0, 100000000]);
    setCurrentPage(0);
    setSearchParams({});
  };

  const formatPrice = (priceString) => {
    if (!priceString) return "N/A";
    return priceString;
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="space-y-2">
          {Array.isArray(categories) &&
            categories
              .filter((c) => c.level === 1)
              .map((category) => (
                <div key={category.categoryId}>
                  <button
                    onClick={() => {
                      handleCategoryClick(category, 1);
                      if (category.subCategories?.length > 0) {
                        toggleCategory(category.categoryId);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                      selectedTopLevelCategory === category.name &&
                      !selectedSecondLevelCategory
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>{category.name}</span>
                    {category.subCategories?.length > 0 && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          expandedCategories.includes(category.categoryId)
                            ? "rotate-90"
                            : ""
                        }`}
                      />
                    )}
                  </button>
                  {category.subCategories?.length > 0 &&
                    expandedCategories.includes(category.categoryId) && (
                      <div className="ml-4 mt-2 space-y-2">
                        {category.subCategories.map((child) => (
                          <button
                            key={child.categoryId}
                            onClick={() =>
                              handleCategoryClick(child, 2, category.name)
                            }
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

      {/* Active Filters */}
      {(selectedTopLevelCategory ||
        priceRange[0] > 0 ||
        priceRange[1] < 100000000) && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Active Filters</h3>
          <div className="space-y-2">
            {selectedTopLevelCategory && (
              <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                <span>
                  {selectedTopLevelCategory}
                  {selectedSecondLevelCategory &&
                    ` > ${selectedSecondLevelCategory}`}
                </span>
                <button
                  onClick={() => {
                    setSelectedTopLevelCategory("");
                    setSelectedSecondLevelCategory("");
                    setSearchParams({});
                  }}
                  className="hover:text-blue-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 100000000) && (
              <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                <span>
                  {priceRange[0].toLocaleString()}đ - {priceRange[1].toLocaleString()}đ
                </span>
                <button
                  onClick={() => setPriceRange([0, 100000000])}
                  className="hover:text-blue-900"
                >
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
            max="100000000"
            step="1000000"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], parseInt(e.target.value)])
            }
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{priceRange[0].toLocaleString()}đ</span>
            <span>{priceRange[1].toLocaleString()}đ</span>
          </div>
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {searchParams.get("search")
              ? `Search results for "${searchParams.get("search")}"`
              : "All Products"}
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
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowFilters(false)}
              ></div>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
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
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {loading
                  ? "Loading..."
                  : `${totalElements} products found`}
              </p>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
                  >
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
                <p className="text-gray-500 text-lg">
                  No products found. Try adjusting your filters.
                </p>
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
                          src={
                            product.thumbnailUrl ||
                            "/placeholder.svg?height=300&width=300"
                          }
                          alt={product.title}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {product.hasDiscount && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Sale
                          </div>
                        )}
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">
                          {product.brand}
                        </p>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.averageRating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            ({product.numRatings || 0})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {product.hasDiscount ? (
                              <>
                                <p className="text-sm text-gray-400 line-through">
                                  {formatPrice(product.priceRange)}
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                  {formatPrice(product.discountedPriceRange)}
                                </p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-blue-600">
                                {formatPrice(product.priceRange)}
                              </p>
                            )}
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
                      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                      }
                      disabled={currentPage === totalPages - 1}
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
  );
}