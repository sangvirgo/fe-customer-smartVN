import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import axiosInstance from "../../services/axios";
import ProductCard from "../../components/ProductCard";
import FilterSidebar from "../../components/FilterSidebar";

export default function Category() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topLevel = searchParams.get("topLevel")
  const secondLevel = searchParams.get("secondLevel")

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [searchParams, currentPage, sortBy])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Add category filters
      if (topLevel) params.set("topLevelCategory", topLevel)
      if (secondLevel) params.set("secondLevelCategory", secondLevel)

      // Add price filters if present
      const minPrice = searchParams.get("minPrice")
      const maxPrice = searchParams.get("maxPrice")
      if (minPrice) params.set("minPrice", minPrice)
      if (maxPrice) params.set("maxPrice", maxPrice)

      // Add pagination
      params.set("page", currentPage)
      params.set("size", "12")

      // Add sorting
      if (sortBy) params.set("sort", sortBy)

      const response = await axiosInstance.get(`/api/v1/products?${params.toString()}`)
      setProducts(response.data.data.content || [])
      setTotalPages(response.data.data.totalPages || 0)
      setTotalElements(response.data.data.totalElements || 0)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Render the component
  return (
    <div>
      <Header />
      <div className="flex">
        {showFilters && <FilterSidebar />}
        <div className="flex-grow">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
