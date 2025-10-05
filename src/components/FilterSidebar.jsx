"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import axiosInstance from "../api/axios"

export default function FilterSidebar({ onFilterChange, currentFilters = {} }) {
  const [categories, setCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    fetchCategories()
    // Initialize price range from URL params
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    if (minPrice || maxPrice) {
      setPriceRange({ min: minPrice || "", max: maxPrice || "" })
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/categories")
      setCategories(response.data.data || response.data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // Category selection logic
  const handleCategorySelect = (category, parentCategory = null) => {
    const newParams = new URLSearchParams(searchParams)

    if (category.level === 1) {
      // Level 1 selected
      newParams.set("topLevel", category.name)
      newParams.delete("secondLevel")
    } else if (category.level === 2 && parentCategory) {
      // Level 2 selected
      newParams.set("secondLevel", category.name)
    }

    setSearchParams(newParams)
    onFilterChange(newParams)
  }

  // Price range logic
  const handlePriceChange = (e) => {
    const { name, value } = e.target
    setPriceRange((prev) => ({ ...prev, [name]: value }))
  }

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set("minPrice", priceRange.min)
    newParams.set("maxPrice", priceRange.max)
    setSearchParams(newParams)
    onFilterChange(newParams)
  }

  // Render categories
  const renderCategories = (cats, parentCategory = null) => {
    return cats.map((category) => (
      <div key={category.id} className="category-item">
        {category.level === 1 && <button onClick={() => handleCategorySelect(category)}>{category.name}</button>}
        {category.level === 2 && parentCategory && (
          <button onClick={() => handleCategorySelect(category, parentCategory)}>{category.name}</button>
        )}
        {category.children && <div className="sub-categories">{renderCategories(category.children, category)}</div>}
      </div>
    ))
  }

  return (
    <div className="filter-sidebar">
      <div className="category-section">
        <h2>Categories</h2>
        {renderCategories(categories)}
      </div>
      <div className="price-section">
        <h2>Price Range</h2>
        <input type="number" name="min" placeholder="Min Price" value={priceRange.min} onChange={handlePriceChange} />
        <input type="number" name="max" placeholder="Max Price" value={priceRange.max} onChange={handlePriceChange} />
        <button onClick={handlePriceApply}>Apply</button>
      </div>
    </div>
  )
}
