import { Link } from "react-router-dom"
import { Star } from "lucide-react"

export default function ProductCard({ product }) {
  const hasDiscount = product.discountedPriceRange && product.discountedPriceRange !== product.priceRange

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.thumbnailUrl || product.images?.[0] || "/placeholder.svg?height=300&width=300"}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            SALE
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-800 px-4 py-2 rounded-md font-bold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && <p className="text-sm text-gray-500 mb-1">{product.brand}</p>}

        {/* Title */}
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{product.title}</h3>

        {/* Price */}
        <div className="mb-3">
          {hasDiscount ? (
            <>
              <p className="text-red-600 font-bold text-lg">{product.discountedPriceRange}</p>
              <p className="text-gray-400 text-sm line-through">{product.priceRange}</p>
            </>
          ) : (
            <p className="text-gray-800 font-bold text-lg">
              {product.priceRange || `$${product.minPrice || product.price}`}
            </p>
          )}
        </div>

        {/* Rating */}
        {product.numRatings > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.averageRating || 0) ? "fill-yellow-400" : "fill-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.numRatings})</span>
          </div>
        )}

        {/* Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {product.badges.map((badge, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
