import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { useSearchParams, useNavigate, Link } from "react-router-dom"; // Added useNavigate, Link
import toast from 'react-hot-toast'; // Use react-hot-toast
import productService from "../../services/productService"; // Use productService
import ProductCard from "../../components/ProductCard";
import FilterSidebar from "../../components/FilterSidebar";
import { SlidersHorizontal, X, Loader2, Search } from "lucide-react"; // Added Loader2, Search

export default function Category() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Memoize fetchProducts using useCallback to prevent unnecessary calls in FilterSidebar effect
  const fetchProducts = useCallback(async (page = 0) => {
     setLoading(true);
     // Read params directly inside fetch function to ensure freshness
     const currentParams = Object.fromEntries(searchParams.entries());
     const paramsPayload = {
       page: page,
       size: 12,
       keyword: currentParams.search || undefined, // Use search for keyword
       topLevelCategory: currentParams.topLevelCategory || undefined,
       secondLevelCategory: currentParams.secondLevelCategory || undefined,
       minPrice: currentParams.minPrice || undefined,
       maxPrice: currentParams.maxPrice || undefined,
       // Add sort if needed, e.g., sort: currentParams.sort || 'defaultSort,asc'
     };

     // Remove undefined params before calling service
     Object.keys(paramsPayload).forEach(key => paramsPayload[key] === undefined && delete paramsPayload[key]);


    try {
      const pageData = await productService.getProducts(paramsPayload);
      setProducts(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
      setCurrentPage(pageData.number || 0); // Update currentPage based on response
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.message || "Failed to fetch products");
      setProducts([]); // Clear products on error
      setTotalPages(0);
      setTotalElements(0);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams]); // Depend on searchParams

  // Initial fetch and fetch on page change
  useEffect(() => {
     // Get page from URL on initial load if present, default to 0
     const initialPage = parseInt(searchParams.get("page") || "0", 10);
     fetchProducts(initialPage);
  }, [fetchProducts]); // Run when fetchProducts function identity changes (due to searchParams)

  // Handler passed to FilterSidebar
// THAY handleFilterChange bằng:
const handleFilterChange = useCallback((newParams) => {
  const currentSearch = searchParams.get('search');
  const finalParams = { ...newParams };
  if (currentSearch) finalParams.search = currentSearch;
  
  Object.keys(finalParams).forEach(key => (!finalParams[key]) && delete finalParams[key]);
  
  // ✅ Replace thay vì push để tránh throttling
  setSearchParams(finalParams, { replace: true });
  setCurrentPage(0);
}, [searchParams, setSearchParams]);

  const handlePageChange = (newPage) => {
     // Update URL param for page
     const currentParams = Object.fromEntries(searchParams.entries());
     setSearchParams({ ...currentParams, page: newPage.toString() });
     setCurrentPage(newPage); // Optimistically update state
     window.scrollTo({ top: 0, behavior: "smooth" });
      // fetchProducts will be called automatically by the useEffect watching searchParams
  };

  // Get display title based on filters/search
   const getPageTitle = () => {
       const search = searchParams.get("search");
       const secondLevel = searchParams.get("secondLevelCategory");
       const topLevel = searchParams.get("topLevelCategory");

       if (search) return `Search results for: "${search}"`;
       if (secondLevel) return secondLevel;
       if (topLevel) return topLevel;
       return "All Products";
   };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Mobile Filter Button */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {loading ? "Searching..." : `${totalElements} products found`}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(true)} // Always open on click
            className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-24">
              <FilterSidebar onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* Mobile Filters Drawer */}
          {showFilters && (
            <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
               {/* Overlay */}
              <div
                className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              ></div>
               {/* Sidebar Content */}
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[calc(100%-2rem)] bg-white shadow-xl overflow-y-auto transform transition-transform ease-in-out duration-300 translate-x-0"> {/* Added transition */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5 border-b pb-3">
                    <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                   {/* Pass filters and handler */}
                  <FilterSidebar onFilterChange={handleFilterChange} />
                   <button
                       onClick={() => setShowFilters(false)}
                       className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                   >
                       Apply Filters
                   </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid & Pagination */}
          <div className="flex-1 min-w-0"> {/* Ensure grid doesn't overflow */}
            {loading ? (
               // Loading Skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
                  >
                    <div className="w-full aspect-square bg-gray-200"></div> {/* Aspect square */}
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
               // No Products Found Message
              <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm">
                 <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium mb-2">No products found matching your criteria.</p>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filters.</p>
                 <button
                     onClick={() => setSearchParams({})} // Clear all params
                     className="text-blue-600 hover:underline text-sm font-medium"
                 >
                     Clear all filters
                 </button>
              </div>
            ) : (
               // Products Grid
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-10">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-600 transition-colors"
                      aria-label="Previous page"
                    >
                      Previous
                    </button>

                    {/* Page Numbers Logic (Simplified example) */}
                    {[...Array(totalPages)].map((_, i) => {
                       // Basic logic to show limited pages around current page
                       const showPage = Math.abs(i - currentPage) < 2 || i === 0 || i === totalPages - 1;
                       const isEllipsis = Math.abs(i - currentPage) === 2 && totalPages > 5 && i !== 0 && i !== totalPages -1;

                       if (isEllipsis) {
                           return <span key={`ellipsis-${i}`} className="px-1 py-1.5 text-gray-500">...</span>;
                       }
                       if (!showPage && totalPages > 5) {
                           return null;
                       }

                       return (
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              currentPage === i
                                ? "bg-blue-600 text-white shadow-sm"
                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                             aria-current={currentPage === i ? 'page' : undefined}
                          >
                            {i + 1}
                          </button>
                       );
                    })}


                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-600 transition-colors"
                      aria-label="Next page"
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