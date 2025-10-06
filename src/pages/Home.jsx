import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  TrendingUp,
  Zap,
  Shield,
  Truck,
} from "lucide-react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import axiosInstance from "../services/axios";
import { showToast } from "../components/Toast";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        axiosInstance.get("/categories"),
        axiosInstance.get("/products", { params: { size: 8 } }), // Bỏ sort
      ]);

      console.log("Categories response:", categoriesRes.data); // Debug
      console.log("Products response:", productsRes.data); // Debug

      const categoriesData = Array.isArray(categoriesRes.data?.data) 
        ? categoriesRes.data.data 
        : [];
      const productsData = productsRes.data?.data?.content || [];

      setCategories(categoriesData.filter(c => c.level === 1).slice(0, 6));
      setFeaturedProducts(productsData);
    } catch (error) {
      console.error("Error fetching home data:", error);
      showToast(error.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="block">Welcome to</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">SmartVN</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-300">
              Discover amazing products at unbeatable prices. Shop smart, live better.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Shop Now <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Free Shipping</h3>
                <p className="text-sm text-gray-600">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                <p className="text-sm text-gray-600">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
                <p className="text-sm text-gray-600">2-3 business days</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Best Prices</h3>
                <p className="text-sm text-gray-600">Guaranteed lowest</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
              <Link to="/products" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                View All <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category) => (
                  <Link
                    key={category.categoryId}
                    to={`/products?topLevelCategory=${encodeURIComponent(category.name)}`}
                    className="group text-center"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                      <span className="text-4xl">{category.icon || "💻"}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <Link to="/products" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                View All <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="w-full h-64 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SmartVN</h3>
              <p className="text-gray-400">Your trusted e-commerce platform for quality products at great prices.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/profile" className="hover:text-white transition-colors">My Account</Link></li>
                <li><Link to="/profile?tab=orders" className="hover:text-white transition-colors">Order History</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SmartVN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}