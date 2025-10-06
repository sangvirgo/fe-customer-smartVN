import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  MapPin,
  Store,
  AlertCircle,
} from "lucide-react";
import Header from "../../components/Header";
import axiosInstance from "../../services/axios";
import { addToCart } from "../../utils/cart";
import { showToast } from "../../components/Toast";
import ProductCard from "../../components/ProductCard";

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedStoreVariant, setSelectedStoreVariant] = useState(null);
  const [activeTab, setActiveTab] = useState("description")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    setIsLoggedIn(!!token)
    fetchProductDetails()
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const [productRes, reviewsRes] = await Promise.all([
        axiosInstance.get(`/products/${id}`),
        axiosInstance.get(`/products/${id}/reviews`),
      ])

      const productData = productRes.data.data 
      const reviewsData = reviewsRes.data.data.content 
      
      setProduct(productData)
      setReviews(reviewsData)

      if (productData.priceVariants?.length > 0) {
        const uniqueSizes = [...new Set(productData.priceVariants.map(v => v.size))]
        const initialSize = uniqueSizes[0];
        setSelectedSize(initialSize);
        
        const firstVariantForSize = productData.priceVariants.find(v => v.size === initialSize);
        setSelectedStoreVariant(firstVariantForSize);
      }

      if (productData.categoryId) {
        const relatedRes = await axiosInstance.get(
          `/products?page=0&size=4`
        )
        setRelatedProducts(relatedRes.data.data.content || [])
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
      showToast("Failed to load product details", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      showToast("Please login to add items to cart", "error")
      navigate("/login")
      return
    }

    if (!selectedStoreVariant) {
      showToast("Please select a store", "error")
      return
    }

    addToCart(product, 1, selectedSize, selectedStoreVariant)
    showToast("Added to cart successfully!", "success")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
                    <div className="grid grid-cols-4 gap-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="w-full h-24 bg-gray-200 rounded-lg"></div>)}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                </div>
            </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
        </div>
      </div>
    )
  }
  
  const uniqueSizes = product.priceVariants ? [...new Set(product.priceVariants.map(v => v.size))] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <img
                src={product.imageUrls?.[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(product.imageUrls || []).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? "border-blue-600" : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.averageRating?.toFixed(1)} ({product.reviewCount || 0} reviews)
                </span>
              </div>
            </div>

            {/* Size Selection */}
            {uniqueSizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        const firstVariantWithSize = product.priceVariants.find(v => v.size === size);
                        setSelectedStoreVariant(firstVariantWithSize);
                      }}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedSize === size
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Store Selection */}
            {product.priceVariants && product.priceVariants.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available at Stores</h3>
                <div className="space-y-3">
                  {product.priceVariants
                    .filter(v => v.size === selectedSize)
                    .map((variant) => (
                      <div
                        key={variant.inventoryId}
                        onClick={() => setSelectedStoreVariant(variant)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStoreVariant?.inventoryId === variant.inventoryId
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Store className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">{variant.storeName}</span>
                          </div>
                          <div className="text-right">
                            {variant.discountPercent > 0 ? (
                              <>
                                <span className="text-sm text-gray-400 line-through block">
                                  {variant.price.toLocaleString()}đ
                                </span>
                                <span className="text-2xl font-bold text-red-600">
                                  {variant.discountedPrice.toLocaleString()}đ
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-blue-600">
                                {variant.price.toLocaleString()}đ
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${variant.inStock ? "text-green-600" : "text-red-600"}`}>
                            {variant.inStock ? `${variant.quantity} in stock` : "Out of stock"}
                          </span>
                           {variant.discountPercent > 0 && (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">
                              -{variant.discountPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedStoreVariant || !selectedStoreVariant.inStock}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isLoggedIn ? "Add to Cart" : "Login to Add to Cart"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-6">
                <button onClick={() => setActiveTab("description")} className={`py-4 font-semibold border-b-2 transition-colors ${activeTab === "description" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>Description</button>
                <button onClick={() => setActiveTab("specifications")} className={`py-4 font-semibold border-b-2 transition-colors ${activeTab === "specifications" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>Details</button>
                <button onClick={() => setActiveTab("reviews")} className={`py-4 font-semibold border-b-2 transition-colors ${activeTab === "reviews" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>Reviews ({reviews.length})</button>
                </div>
            </div>
            <div className="p-6">
                {activeTab === "description" && <div className="prose max-w-none"><p className="text-gray-700 leading-relaxed">{product.description}</p></div>}
                {activeTab === "specifications" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border-b py-2"><span className="font-semibold">Brand:</span><span className="ml-2 text-gray-600">{product.brand}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">Color:</span><span className="ml-2 text-gray-600">{product.color}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">Weight:</span><span className="ml-2 text-gray-600">{product.weight}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">Dimension:</span><span className="ml-2 text-gray-600">{product.dimension}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">RAM:</span><span className="ml-2 text-gray-600">{product.ramCapacity}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">Storage:</span><span className="ml-2 text-gray-600">{product.romCapacity}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">Screen:</span><span className="ml-2 text-gray-600">{product.screenSize}</span></div>
                            <div className="border-b py-2"><span className="font-semibold">Battery:</span><span className="ml-2 text-gray-600">{product.batteryCapacity}</span></div>
                        </div>
                    </div>
                )}
                {activeTab === "reviews" && (
                    <div className="space-y-6">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {review.userFirstName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {review.userFirstName} {review.userLastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.reviewContent}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
            </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}