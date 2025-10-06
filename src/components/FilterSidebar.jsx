"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import axiosInstance from "../services/axios"

export default function FilterSidebar({ onFilterChange, currentFilters = {} }) {
  const [categories, setCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    fetchCategories()
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    if (minPrice || maxPrice) {
      setPriceRange({ min: minPrice || "", max: maxPrice || "" })
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/categories")
      const categoriesData = response.data?.data || []
      
      // Chỉ lấy categories level 1 để tránh duplicate
      const level1Categories = categoriesData.filter(cat => cat.level === 1)
      
      console.log("Categories fetched:", level1Categories)
      setCategories(Array.isArray(level1Categories) ? level1Categories : [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
    }
  }

  const handleCategorySelect = (category, parentCategory = null) => {
    const newParams = new URLSearchParams(searchParams)

    if (category.level === 1) {
      newParams.set("topLevelCategory", category.name)
      newParams.delete("secondLevelCategory")
    } else if (category.level === 2 && parentCategory) {
      newParams.set("topLevelCategory", parentCategory.name)
      newParams.set("secondLevelCategory", category.name)
    }

    setSearchParams(newParams)
    onFilterChange(newParams)
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    setPriceRange((prev) => ({ ...prev, [name]: value }))
  }

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams)
    if (priceRange.min) newParams.set("minPrice", priceRange.min)
    else newParams.delete("minPrice")
    
    if (priceRange.max) newParams.set("maxPrice", priceRange.max)
    else newParams.delete("maxPrice")
    
    setSearchParams(newParams)
    onFilterChange(newParams)
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const renderCategories = (cats, parentCategory = null) => {
    if (!cats || cats.length === 0) return null
    
    return cats.map((category) => (
      <div key={category.categoryId} className="my-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => handleCategorySelect(category, parentCategory)}
            className="text-left flex-1 hover:text-blue-600 transition-colors py-1"
          >
            {category.name}
          </button>
          
          {/* Nếu có subcategories, hiển thị expand button */}
          {category.subCategories && category.subCategories.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCategory(category.categoryId)
              }}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              {expandedCategories.has(category.categoryId) ? "−" : "+"}
            </button>
          )}
        </div>
        
        {/* Render subcategories nếu đã expand */}
        {category.subCategories && 
         category.subCategories.length > 0 && 
         expandedCategories.has(category.categoryId) && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {renderCategories(category.subCategories, category)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-6 bg-white p-4 rounded-lg shadow">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading categories...</p>
        ) : (
          renderCategories(categories)
        )}
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-2">
          <input 
            type="number" 
            name="min" 
            placeholder="Min Price" 
            value={priceRange.min} 
            onChange={handlePriceChange} 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input 
            type="number" 
            name="max" 
            placeholder="Max Price" 
            value={priceRange.max} 
            onChange={handlePriceChange} 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={handlePriceApply} 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  )
}