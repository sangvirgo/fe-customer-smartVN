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

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedStore, setSelectedStore] = useState(null)
  const [activeTab, setActiveTab] = useState("description")
  const [expandedSpecs, setExpandedSpecs] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    setIsLoggedIn(!!token)
    fetchProductDetails()
  }, [id])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const [productRes, reviewsRes] = await Promise.all([
        axiosInstance.get(`/products/${id}`),
        axiosInstance.get(`/products/${id}/reviews`),
      ])

      setProduct(productRes.data)
      setReviews(reviewsRes.data)

      // Set default selections
      if (productRes.data.sizes?.length > 0) {
        setSelectedSize(productRes.data.sizes[0])
      }
      if (productRes.data.stores?.length > 0) {
        setSelectedStore(productRes.data.stores[0])
      }

      // Fetch related products
      if (productRes.data.categoryId) {
        const relatedRes = await axiosInstance.get(
          `/products?category=${productRes.data.categoryId}&limit=4&exclude=${id}`,
        )
        setRelatedProducts(relatedRes.data.products || relatedRes.data)
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

    if (!selectedStore) {
      showToast("Please select a store", "error")
      return
    }

    addToCart(product, 1, selectedSize, selectedStore)
    showToast("Added to cart successfully!", "success")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-24 bg-gray-200 rounded-lg"></div>
                  ))}
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
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <img
                src={product.images?.[selectedImage] || product.image || "/placeholder.svg?height=600&width=600"}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(product.images || [product.image]).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? "border-blue-600" : "border-transparent"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg?height=150&width=150"}
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
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating?.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
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
            {product.stores && product.stores.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available at Stores</h3>
                <div className="space-y-3">
                  {product.stores.map((store) => (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedStore?.id === store.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Store className="w-5 h-5 text-gray-600" />
                          <span className="font-semibold text-gray-900">{store.name}</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">${store.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{store.location}</span>
                        </div>
                        <span className={`font-medium ${store.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                          {store.stock > 0 ? `${store.stock} in stock` : "Out of stock"}
                        </span>
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
                disabled={!selectedStore || selectedStore.stock === 0}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isLoggedIn ? "Add to Cart" : "Login to Add to Cart"}</span>
              </button>
              <button className="p-3 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
              <button className="p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {!isLoggedIn && (
              <div className="flex items-start space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Please{" "}
                  <Link to="/login" className="font-semibold underline">
                    login
                  </Link>{" "}
                  to add items to your cart and checkout.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("description")}
                className={`py-4 font-semibold border-b-2 transition-colors ${
                  activeTab === "description"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`py-4 font-semibold border-b-2 transition-colors ${
                  activeTab === "specifications"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 font-semibold border-b-2 transition-colors ${
                  activeTab === "reviews"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.specifications?.map((spec, index) => (
                    <div key={index} className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-900">{spec.name}</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {!isLoggedIn && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Link to="/login" className="font-semibold underline">
                        Login
                      </Link>{" "}
                      to write a review
                    </p>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">{review.userName?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{review.userName}</p>
                            <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
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
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        relatedProduct.images?.[0] || relatedProduct.image || "/placeholder.svg?height=300&width=300"
                      }
                      alt={relatedProduct.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">{relatedProduct.brand}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{relatedProduct.title}</h3>
                    <p className="text-lg font-bold text-blue-600">${relatedProduct.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
