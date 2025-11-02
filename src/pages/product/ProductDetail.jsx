import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from 'react-hot-toast';
import {
  Star,
  ShoppingCart,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
  Package,
  TruckIcon,
} from "lucide-react";

// Import services
import productService from "../../services/productService";
import cartService from "../../services/cartService";
import ProductCard from "../../components/ProductCard";
import { useAuthAction } from '../../hooks/useAuthCheck';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviewsPage, setReviewsPage] = useState({ content: [], totalPages: 0, number: 0 });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [hasUserPurchased, setHasUserPurchased] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const { checkAuth } = useAuthAction();

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchProductReviews(0);
    }
  }, [activeTab, id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setHasUserReviewed(false);
      setHasUserPurchased(false);

      const token = localStorage.getItem("accessToken");
      const loggedIn = !!token;
      setIsLoggedIn(loggedIn);

      const productData = await productService.getProductById(id);
      setProduct(productData);

      fetchProductReviews(0);

      // Set initial size and variant
      if (productData.priceVariants?.length > 0) {
        const uniqueSizes = [...new Set(productData.priceVariants.map(v => v.size))];
        if (uniqueSizes.length > 0) {
          setSelectedSize(uniqueSizes[0]);
        }
      }

      // Fetch related products
      if (productData.categoryId) {
        try {
          const relatedParams = { size: 4 };
          const relatedResult = await productService.getProducts(relatedParams);
          setRelatedProducts((relatedResult.content || []).filter(p => p.id !== productData.id));
        } catch (relatedError) {
          console.error("Error fetching related products:", relatedError);
        }
      }

      // ✅ Check if user has purchased (only if logged in)
      if (loggedIn) {
        setCheckingPurchase(true);
        try {
          const purchased = await productService.checkUserPurchased(id);
          setHasUserPurchased(purchased);
        } catch (error) {
          console.error("Error checking purchase status:", error);
        } finally {
          setCheckingPurchase(false);
        }
      }

    } catch (error) {
      console.error("Error fetching product details:", error);
      toast.error(error.message || "Failed to load product details");
      if (error.response?.status === 404) {
        navigate('/404');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async (page = 0) => {
    setLoadingReviews(true);
    try {
      const reviewsData = await productService.getProductReviews(id, page, 5);
      setReviewsPage(reviewsData);

      if (isLoggedIn) {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userReview = reviewsData.content.find(r => r.userId === currentUser.id);
        setHasUserReviewed(!!userReview);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddToCart = async () => {
    if (!checkAuth("thêm sản phẩm vào giỏ hàng")) return;

    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    const selectedVariant = product.priceVariants?.find(v => v.size === selectedSize);
    if (!selectedVariant || !selectedVariant.inStock || selectedVariant.quantity < 1) {
      toast.error("This option is currently out of stock");
      return;
    }

    setIsAddingToCart(true);
    try {
      await cartService.addToCart(product.id, selectedSize, 1);
      toast.success("Added to cart successfully!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      toast.error(error.message || "Failed to add item to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please login to write a review");
      navigate("/login");
      return;
    }

    if (!reviewForm.content.trim()) {
      toast.error("Please write your review before submitting");
      return;
    }

    if (reviewForm.content.length > 500) {
      toast.error("Review content cannot exceed 500 characters.");
      return;
    }

    setSubmittingReview(true);
    try {
      await productService.createReview(id, reviewForm.rating, reviewForm.content);
      toast.success("Review submitted successfully! Thank you.");
      setReviewForm({ rating: 5, content: "" });
      setShowReviewForm(false);
      setHasUserReviewed(true);
      fetchProductReviews(0);
    } catch (error) {
      console.error("Error submitting review:", error);
      if (error.message?.includes("already reviewed")) {
        toast.error("You have already reviewed this product.");
        setHasUserReviewed(true);
        setShowReviewForm(false);
      } else {
        toast.error(error.message || "Unable to submit review. Please try again.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewPageChange = (newPage) => {
    if (newPage >= 0 && newPage < reviewsPage.totalPages) {
      fetchProductReviews(newPage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="w-full h-24 bg-gray-200 rounded-lg"></div>)}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="flex items-center space-x-4">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded-lg w-16"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-16"></div>
              </div>
              <div className="h-32 bg-gray-200 rounded-lg w-full mt-6"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-full mt-6"></div>
            </div>
          </div>
          <div className="mt-12 bg-white rounded-lg shadow-sm h-64">
            <div className="border-b h-14 bg-gray-100 rounded-t-lg"></div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-xl font-medium">Product not found</p>
          <Link to="/products" className="mt-4 inline-block text-blue-600 hover:underline">
            Go back to products
          </Link>
        </div>
      </div>
    );
  }

  const uniqueSizes = product.priceVariants ? [...new Set(product.priceVariants.map(v => v.size))] : [];
  const selectedVariant = product.priceVariants?.find(v => v.size === selectedSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4 shadow aspect-square flex items-center justify-center">
              <img
                src={product.imageUrls?.[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imageUrls.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-md overflow-hidden border-2 transition-all aspect-square ${
                      selectedImage === index ? "border-blue-600 ring-2 ring-blue-300" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.brand && <p className="text-sm text-gray-500 mb-1">{product.brand}</p>}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.averageRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.averageRating?.toFixed(1) || 'No Rating'} ({product.numRatings || 0} reviews)
                </span>
              </div>
            </div>

            {/* Size Selection */}
            {uniqueSizes.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  Select Size: <span className="text-gray-600 font-medium">{selectedSize || 'N/A'}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all text-sm ${
                        selectedSize === size
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-300"
                          : "border-gray-300 bg-white hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ IMPROVED: Price & Stock Info Card */}
            {selectedVariant && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <div className="flex items-baseline gap-3">
                      {selectedVariant.discountPercent > 0 ? (
                        <>
                          <span className="text-3xl font-bold text-red-600">
                            {selectedVariant.discountedPrice.toLocaleString()}đ
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            {selectedVariant.price.toLocaleString()}đ
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-blue-600">
                          {selectedVariant.price.toLocaleString()}đ
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedVariant.discountPercent > 0 && (
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                      -{selectedVariant.discountPercent}%
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <Package className={`w-5 h-5 ${selectedVariant.inStock ? "text-green-600" : "text-red-600"}`} />
                    <span className={`font-medium ${selectedVariant.inStock ? "text-green-600" : "text-red-600"}`}>
                      {selectedVariant.inStock && selectedVariant.quantity > 0 
                        ? `${selectedVariant.quantity} in stock` 
                        : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <TruckIcon className="w-5 h-5" />
                    <span className="text-sm">Free shipping</span>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <div className="pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedVariant?.inStock || selectedVariant?.quantity < 1 || isAddingToCart}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
              {!isLoggedIn && (
                <p className="text-xs text-center mt-3 text-gray-500">
                  You need to <Link to="/login" state={{ from: `/products/${id}` }} className="text-blue-600 underline font-medium">login</Link> first.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button onClick={() => setActiveTab("description")} className={`py-4 font-semibold border-b-2 transition-colors ${activeTab === "description" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                Description
              </button>
              <button onClick={() => setActiveTab("specifications")} className={`py-4 font-semibold border-b-2 transition-colors ${activeTab === "specifications" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                Details
              </button>
              <button onClick={() => setActiveTab("reviews")} className={`py-4 font-semibold border-b-2 transition-colors ${activeTab === "reviews" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                Reviews ({product.numRatings || 0})
              </button>
            </div>
          </div>

          <div className="p-6 min-h-[200px]">
            {activeTab === "description" && (
              <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
                {product.description || "No description available."}
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="space-y-3 text-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {product.brand && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Brand:</span><span className="text-gray-800">{product.brand}</span></div>}
                  {product.color && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Color:</span><span className="text-gray-800">{product.color}</span></div>}
                  {product.weight && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Weight:</span><span className="text-gray-800">{product.weight}</span></div>}
                  {product.dimension && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Dimensions:</span><span className="text-gray-800">{product.dimension}</span></div>}
                  {product.ramCapacity && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">RAM:</span><span className="text-gray-800">{product.ramCapacity}</span></div>}
                  {product.romCapacity && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Storage:</span><span className="text-gray-800">{product.romCapacity}</span></div>}
                  {product.screenSize && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Screen Size:</span><span className="text-gray-800">{product.screenSize}</span></div>}
                  {product.batteryCapacity && <div className="flex justify-between border-b py-1.5"><span className="font-medium text-gray-600">Battery:</span><span className="text-gray-800">{product.batteryCapacity}</span></div>}
                </div>
                {!product.brand && !product.color && <p className="text-gray-500">No specific details available.</p>}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Customer Reviews</h3>

                {/* ✅ IMPROVED: Review Form with Purchase Check */}
                {isLoggedIn ? (
                  hasUserReviewed ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800">You have already reviewed this product. Thank you for your feedback!</p>
                    </div>
                  ) : checkingPurchase ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                      <p className="text-sm text-gray-600">Checking purchase status...</p>
                    </div>
                  ) : !hasUserPurchased ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800 font-medium mb-1">Purchase Required</p>
                        <p className="text-sm text-amber-700">You need to purchase this product before writing a review.</p>
                      </div>
                    </div>
                  ) : showReviewForm ? (
                    <form onSubmit={handleSubmitReview} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Your Rating:</label>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= reviewForm.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 hover:text-gray-400"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="reviewContent" className="sr-only">Your Review</label>
                        <textarea
                          id="reviewContent"
                          value={reviewForm.content}
                          onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                          placeholder="Share your experience..."
                          rows={4}
                          maxLength={500}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{reviewForm.content.length}/500</p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowReviewForm(false);
                            setReviewForm({ rating: 5, content: "" });
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {submittingReview && <Loader2 className="w-4 h-4 animate-spin"/>}
                          Submit Review
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center p-6 border border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                      <p className="text-gray-700 mb-3 text-sm font-medium">You've purchased this product. Share your thoughts!</p>
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        Write a Review
                      </button>
                    </div>
                  )
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Please <Link to="/login" state={{ from: `/products/${id}` }} className="font-semibold underline hover:text-yellow-900">login</Link> to write a review.
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                 {loadingReviews ? (
                     <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                 ) : reviewsPage.content.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No reviews yet.</div>
                 ) : (
                   <div className="space-y-5">
                     {reviewsPage.content.map((review) => (
                       <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                         <div className="flex items-center justify-between mb-1.5">
                           <div className="flex items-center space-x-2">
                             {/* Simple Avatar Placeholder */}
                             <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                               <span className="text-sm font-semibold text-gray-600">
                                 {review.userFirstName?.charAt(0).toUpperCase()}
                               </span>
                             </div>
                             <div>
                               <p className="font-medium text-sm text-gray-800">
                                 {review.userFirstName} {review.userLastName}
                               </p>
                               <p className="text-xs text-gray-500">
                                 {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </p>
                             </div>
                           </div>
                           {/* Rating Stars */}
                           <div className="flex items-center">
                             {[...Array(5)].map((_, i) => (
                               <Star
                                 key={i}
                                 className={`w-4 h-4 ${
                                   i < review.rating
                                     ? "text-yellow-400 fill-yellow-400"
                                     : "text-gray-300"
                                 }`}
                               />
                             ))}
                           </div>
                         </div>
                         {/* Review Content */}
                         <p className="text-gray-700 text-sm leading-relaxed mt-2">{review.reviewContent || ""}</p>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Review Pagination */}
                 {reviewsPage.totalPages > 1 && (
                     <div className="flex justify-center items-center space-x-2 mt-6 text-sm">
                         <button
                             onClick={() => handleReviewPageChange(reviewsPage.number - 1)}
                             disabled={reviewsPage.number === 0}
                             className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                         >
                             Previous
                         </button>
                         <span>Page {reviewsPage.number + 1} of {reviewsPage.totalPages}</span>
                         <button
                             onClick={() => handleReviewPageChange(reviewsPage.number + 1)}
                             disabled={reviewsPage.number === reviewsPage.totalPages - 1}
                             className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                         >
                             Next
                         </button>
                     </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}