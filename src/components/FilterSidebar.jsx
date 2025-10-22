import { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import axiosInstance from "../services/axios"; // Assuming axios setup
import { useSearchParams } from "react-router-dom";

export default function FilterSidebar({ onFilterChange }) {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);

  // Initialize state from URL params or defaults
  const [selectedTopLevel, setSelectedTopLevel] = useState(searchParams.get("topLevelCategory") || "");
  const [selectedSecondLevel, setSelectedSecondLevel] = useState(searchParams.get("secondLevelCategory") || "");
  const [minPrice, setMinPrice] = useState(parseInt(searchParams.get("minPrice") || "0", 10));
  const [maxPrice, setMaxPrice] = useState(parseInt(searchParams.get("maxPrice") || "100000000", 10)); // Max 100 million VND

  useEffect(() => {
    fetchCategories();
  }, []);

   // Effect to update filters when state changes
// THAY useEffect hiện tại bằng debounce:
useEffect(() => {
  const timer = setTimeout(() => {
    const params = {};
    if (selectedTopLevel) params.topLevelCategory = selectedTopLevel;
    if (selectedSecondLevel) params.secondLevelCategory = selectedSecondLevel;
    if (minPrice > 0) params.minPrice = minPrice.toString();
    if (maxPrice < 100000000) params.maxPrice = maxPrice.toString();
    
    onFilterChange(params);
  }, 300); // Debounce 300ms

  return () => clearTimeout(timer);
}, [selectedTopLevel, selectedSecondLevel, minPrice, maxPrice]);


  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/categories");
      // Adjust based on your actual API response structure
      const categoriesData = response.data?.data || [];
       setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Auto-expand parent category if a child is selected from URL
        if (selectedSecondLevel) {
           const parent = categoriesData.find(cat => cat.subCategories?.some(sub => sub.name === selectedSecondLevel));
           if (parent) {
              setExpandedCategories(prev => [...prev, parent.categoryId]);
           }
         } else if (selectedTopLevel) {
            // Auto-expand parent if selected from URL (for consistency)
             const parent = categoriesData.find(cat => cat.name === selectedTopLevel && cat.level === 1);
             if (parent && parent.subCategories?.length > 0) {
                 setExpandedCategories(prev => [...prev, parent.categoryId]);
             }
         }

    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
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
       // If clicking the currently selected top-level, deselect it
       if (selectedTopLevel === category.name && !selectedSecondLevel) {
         setSelectedTopLevel("");
       } else {
         setSelectedTopLevel(category.name);
         setSelectedSecondLevel(""); // Clear second level when selecting top level
       }
     } else if (level === 2) {
       // If clicking the currently selected second-level, deselect it but keep parent
       if (selectedSecondLevel === category.name) {
         setSelectedSecondLevel("");
       } else {
         setSelectedTopLevel(parentName); // Ensure parent is set
         setSelectedSecondLevel(category.name);
       }
     }
  };

   const clearCategoryFilter = () => {
     setSelectedTopLevel("");
     setSelectedSecondLevel("");
   };

   const clearPriceFilter = () => {
      setMinPrice(0);
      setMaxPrice(100000000);
   }

   const clearAllFilters = () => {
      clearCategoryFilter();
      clearPriceFilter();
   }

  // Active filters derived from state
   const activeCategoryFilter = selectedSecondLevel || selectedTopLevel;
   const activePriceFilter = minPrice > 0 || maxPrice < 100000000;


  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-1">
          {categories
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
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors text-sm ${
                    selectedTopLevel === category.name && !selectedSecondLevel
                      ? "bg-blue-50 text-blue-700 font-medium"
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
                {/* Subcategories */}
                 {category.subCategories?.length > 0 && expandedCategories.includes(category.categoryId) && (
                     <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-1">
                        {category.subCategories.map((child) => (
                         <button
                           key={child.categoryId}
                           onClick={() => handleCategoryClick(child, 2, category.name)}
                           className={`block w-full text-left px-3 py-1.5 rounded-md transition-colors text-sm ${
                             selectedSecondLevel === child.name
                               ? "bg-blue-50 text-blue-700 font-medium"
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

       {/* Price Range */}
       <div>
         <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
         <div className="space-y-3 px-1">
           {/* We'll use two inputs for min and max, simpler than a complex range slider */}
           <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 w-8'>Min:</span>
              <input
                type="number"
                min="0"
                max={maxPrice} // Min cannot exceed max
                step="500000" // 500k steps
                value={minPrice}
                 onChange={(e) => setMinPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className='text-xs text-gray-500'>đ</span>
           </div>
           <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 w-8'>Max:</span>
              <input
                type="number"
                min={minPrice} // Max cannot be less than min
                max="100000000"
                step="500000"
                value={maxPrice}
                 onChange={(e) => setMaxPrice(Math.min(100000000, parseInt(e.target.value) || 100000000))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
                <span className='text-xs text-gray-500'>đ</span>
           </div>
           <div className="text-xs text-gray-600 text-center pt-1">
              {minPrice.toLocaleString()}đ - {maxPrice.toLocaleString()}đ
            </div>
         </div>
       </div>


        {/* Active Filters Display & Clear */}
       {(activeCategoryFilter || activePriceFilter) && (
         <div className="border-t pt-4 mt-4">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-semibold text-gray-800">Active Filters</h3>
             <button
               onClick={clearAllFilters}
               className="text-xs text-blue-600 hover:underline font-medium"
             >
               Clear All
             </button>
           </div>
           <div className="flex flex-wrap gap-2">
             {activeCategoryFilter && (
               <div className="flex items-center gap-1 bg-gray-100 text-gray-700 pl-2 pr-1 py-0.5 rounded-full text-xs">
                 <span>Cat: {selectedSecondLevel || selectedTopLevel}</span>
                 <button onClick={clearCategoryFilter} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
               </div>
             )}
             {activePriceFilter && (
               <div className="flex items-center gap-1 bg-gray-100 text-gray-700 pl-2 pr-1 py-0.5 rounded-full text-xs">
                 <span>
                    {minPrice > 0 ? `${minPrice.toLocaleString()}đ` : ''}
                    {(minPrice > 0 && maxPrice < 100000000) ? ' - ' : ''}
                    {maxPrice < 100000000 ? `${maxPrice.toLocaleString()}đ` : ''}
                    {(minPrice === 0 && maxPrice < 100000000) ? 'Under ' : ''}
                    {(minPrice > 0 && maxPrice === 100000000) ? 'Over ' : ''}
                 </span>
                 <button onClick={clearPriceFilter} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
               </div>
             )}
           </div>
         </div>
       )}

    </div>
  );
}