"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Search,
  ChevronRight,
  HomeIcon,
  Menu,
} from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [animatingItem, setAnimatingItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [productRatings, setProductRatings] = useState([]);

  // Banner data
  const banners = [
    {
      id: 1,
      title: "Your Favorites",
      subtitle: "are Back in Stock",
      image:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000",
      backgroundColor: "#4caf50",
    },
    {
      id: 2,
      title: "Kitchen Appliances",
      subtitle: "Quality Appliances for Quality Meals",
      image:
        "https://images.unsplash.com/photo-1556911220-bda9da8a0d5a?q=80&w=1000",
      backgroundColor: "#2196f3",
    },
    {
      id: 3,
      title: "Fresh Produce",
      subtitle: "From Farm to Table",
      image:
        "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1000",
      backgroundColor: "#ff9800",
    },
  ];

  useEffect(() => {
    // Load cart from session storage
    const sessionCart = sessionStorage.getItem("cart");
    if (sessionCart) {
      setCart(JSON.parse(sessionCart));
    }

    // Fetch categories and products
    fetchCategories();
    fetchProducts();

    // Rotate banners every 5 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories/`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
      setFeaturedCategories(data.slice(0, 8));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories. Please try again later.");
    }
  };

  const fetchProductRatings = async (productIds) => {
    try {
      // Create an array of promises for each product rating request
      const ratingPromises = productIds.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/ratings/`)
          .then((response) => {
            if (!response.ok) {
              return { id, ratings: [], average: 0 };
            }
            return response.json();
          })
          .catch(() => ({ id, ratings: [], average: 0 }))
      );

      // Wait for all promises to resolve
      const ratingsData = await Promise.all(ratingPromises);

      // Create a map of product ID to ratings data
      const ratingsMap = {};
      ratingsData.forEach((data) => {
        ratingsMap[data.id] = {
          ratings: data.ratings || [],
          average: data.average || 0,
        };
      });

      return ratingsMap;
    } catch (error) {
      console.error("Error fetching product ratings:", error);
      return {};
    }
  };

  const fetchProducts = async (categorySlug = "") => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/products/`;
      if (categorySlug) {
        url += `?category=${categorySlug}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();

      // Get all product IDs
      const productIds = data.map((product) => product.slug);

      // Fetch ratings for all products
      if (productIds.length > 0) {
        const ratingsData = await fetchProductRatings(productIds);

        // Attach ratings data to products
        const productsWithRatings = data.map((product) => ({
          ...product,
          ratings: ratingsData[product.slug]?.ratings || [],
          average_rating: ratingsData[product.slug]?.average || 0,
        }));

        setProducts(productsWithRatings);
      } else {
        setProducts(data);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again later.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    fetchProducts(value === "all" ? "" : value);
  };

  const addToCart = (product, event) => {
    // Get the cart button position - check for mobile vs desktop
    const isMobile = window.innerWidth < 640;
    const cartButton = isMobile
      ? document.querySelector(".fixed.bottom-4.right-4 .cart-button")
      : document.querySelector(".hidden.sm\\:flex .cart-button");

    if (!cartButton) return; // Safety check

    const cartRect = cartButton.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();

    setAnimatingItem({
      product,
      startX: targetRect.left,
      startY: targetRect.top,
      endX: cartRect.left + cartRect.width / 2,
      endY: cartRect.top + cartRect.height / 2,
    });

    // Set timeout to add to cart after animation starts
    setTimeout(() => {
      // Check if product is already in cart
      const existingItemIndex = cart.findIndex(
        (item) => item.product.id === product.id
      );

      let updatedCart;

      if (existingItemIndex >= 0) {
        // Update quantity if product already in cart
        updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += 1;
      } else {
        // Add new item to cart
        updatedCart = [
          ...cart,
          {
            id: Date.now().toString(),
            product: product,
            quantity: 1,
            price: product.price,
          },
        ];
      }

      // Update state and session storage
      setCart(updatedCart);
      sessionStorage.setItem("cart", JSON.stringify(updatedCart));

      // Briefly highlight the cart button
      cartButton.classList.add("cart-pulse");
      setTimeout(() => {
        cartButton.classList.remove("cart-pulse");
      }, 700);

      // Clear animation after it completes
      setTimeout(() => {
        setAnimatingItem(null);
      }, 800);
    }, 100);
  };

  // Function to toggle cart drawer
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  // Function to remove item from cart
  const removeFromCart = (itemId) => {
    const updatedCart = cart.filter((item) => item.id !== itemId);
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Function to update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  // Filter products based on search term and selected category
  const filteredProducts =
    products && products.length > 0
      ? products.filter((product) => {
          const matchesSearch = product.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          return matchesSearch;
        })
      : [];

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);

    // If we don't already have ratings for this product, fetch them
    if (!product.ratings || product.ratings.length === 0) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.slug}/ratings/`
        );
        if (response.ok) {
          const data = await response.json();
          setProductRatings(data.ratings || []);
        }
      } catch (error) {
        console.error("Error fetching product ratings:", error);
      }
    } else {
      // Use the ratings we already have
      setProductRatings(product.ratings);
    }
  };

  const closeProductDetail = () => {
    setIsProductDetailOpen(false);
    // Wait for animation to complete before clearing the product
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  return (
    <div className="min-h-screen ">
      {/* Header - Improved mobile layout */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
                  <span className="text-black font-bold text-xs sm:text-base">
                    ME
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">
                  Maldives Eats
                </h1>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="flex-1 max-w-xl mx-2 sm:mx-8 hidden sm:block">
              <div className="relative rounded-full border border-gray-300 flex items-center">
                <Search className="absolute left-3 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for products you want"
                  className="pl-10 pr-4 py-2 border-none rounded-full focus:ring-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Mobile Search */}
            <div className="flex-1 mx-2 sm:hidden">
              <div className="relative rounded-full border border-gray-300">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products"
                  className="pl-9 pr-3 py-1.5 border-none rounded-full focus:ring-0 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <Link href="/dashboard">
                {/* <Button
                  variant="outline"
                  className="border-yellow-400 text-yellow-400 hover:bg-yellow-50"
                >
                  My Orders
                </Button> */}
              </Link>
              <div className="relative">
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 px-4 cart-button transition-all duration-300 text-black"
                  onClick={toggleCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span>Cart</span>
                </Button>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center">
              <Button className="p-1.5" variant="ghost" onClick={() => {}}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation - Improved scrolling */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto py-3 no-scrollbar">
            <button
              className={`text-gray-700 hover:text-yellow-600 whitespace-nowrap text-sm sm:text-base ${
                !selectedCategory ? "text-yellow-600 font-medium" : ""
              }`}
              onClick={() => handleCategoryChange("all")}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`text-gray-700 hover:text-yellow-600 whitespace-nowrap text-sm sm:text-base ${
                  selectedCategory === category.slug
                    ? "text-yellow-600 font-medium"
                    : ""
                }`}
                onClick={() => handleCategoryChange(category.slug)}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 pb-20 sm:pb-6 min-h-screen ">
        {/* Filter Controls */}
        <div className="mb-2 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">
            {selectedCategory
              ? categories.find((c) => c.slug === selectedCategory)?.name ||
                selectedCategory
              : "All Products"}
          </h2>
          {/* <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48 border-yellow-400 mt-1 sm:mt-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-yellow-600"></div>
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden transition-shadow flex flex-col text-left"
              onClick={() => openProductDetail(product)}
            >
              <div className="h-32 w-32 overflow-hidden relative flex items-start justify-start">
                <img
                  src={`${product.image}`}
                  alt={product.title}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="pt-2 flex flex-col flex-grow">
                <div className="flex items-center">
                  <div className="text-red-500 text-xs md:text-md font-medium">
                    {product.price} MVR
                  </div>
                  <div className="text-xs text-gray-500 ml-1">
                    / {product.unit}
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1">
                  {product.title}
                </h3>

                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.average_rating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    {product.ratings?.length || 0} reviews
                  </span>
                </div>

                {product.stock > 0 ? (
                  <Button
                    className="mt-auto w-fit rounded-full bg-yellow-400 hover:bg-yellow-500 text-black add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening product detail
                      addToCart(product, e);
                    }}
                  >
                    Add to Cart
                  </Button>
                ) : (
                  <Button
                    className="mt-auto bg-gray-300 text-gray-600 w-fit rounded-full cursor-not-allowed"
                    disabled
                  >
                    Out of Stock
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Cart Button (Mobile Only) */}
      <div className="fixed bottom-4 right-4 sm:hidden z-40">
        <Button
          className="bg-yellow-400 hover:bg-yellow-500 text-black h-14 w-14 rounded-full shadow-lg cart-button transition-all duration-300 flex items-center justify-center"
          onClick={toggleCart}
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </div>
        </Button>
      </div>

      {/* Cart Drawer - Improved mobile styling */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleCart}
      >
        <div
          className={`absolute right-0 top-0 h-full bg-white w-full sm:w-96 shadow-xl transform transition-transform duration-300 ease-in-out ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-yellow-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-yellow-600" />
                Your Cart
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCart}
                className="rounded-full p-1 hover:bg-yellow-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-30 text-yellow-300" />
                  <p className="mb-2 text-lg">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mb-6 text-center">
                    Add some delicious items to your cart and they'll appear
                    here
                  </p>
                  <Button
                    className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black px-6"
                    onClick={toggleCart}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex border-b border-gray-100 pb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-900">
                            <h3 className="line-clamp-2">
                              {item.product.title}
                            </h3>
                            <p className="ml-4 whitespace-nowrap">
                              {item.product.price} MVR
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.product.category_name}
                          </p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm mt-2">
                          <div className="flex items-center border rounded-md bg-white shadow-sm">
                            <button
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </button>
                            <span className="px-3 py-1 font-medium">
                              {item.quantity}
                            </span>
                            <button
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="font-medium text-red-600 hover:text-red-500 flex items-center"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-4 bg-yellow-50">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p className="font-bold text-black">
                    {cartTotal.toFixed(2)} MVR
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Shipping and taxes calculated at checkout.
                </p>
                <div className="space-y-2">
                  <Link href="/cart" className="block">
                    <Button className="w-full bg-yellow-400 hover:bg-yellow-500 py-5 text-base text-black">
                      Checkout
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full border-yellow-400 text-black hover:bg-yellow-50"
                    onClick={toggleCart}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animating Item - Updated to target floating button on mobile */}
      {animatingItem && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: animatingItem.startX,
            top: animatingItem.startY,
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            animation:
              "moveToCart 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards",
          }}
        >
          <img
            src={animatingItem.product.image}
            alt=""
            className="w-full h-full object-cover rounded-full"
            style={{
              animation: "spin 0.8s ease forwards",
            }}
          />
        </div>
      )}

      {/* Product Detail Drawer - Center modal on desktop, bottom drawer on mobile */}
      {selectedProduct && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
            isProductDetailOpen
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={closeProductDetail}
        >
          <div
            className={`transform transition-transform duration-300 ease-in-out bg-white shadow-xl overflow-hidden
              sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-xl sm:w-full sm:rounded-xl
              inset-x-0 bottom-0 rounded-t-xl max-h-[85vh] sm:max-h-[90vh] absolute
              ${
                isProductDetailOpen
                  ? "sm:scale-100 translate-y-0"
                  : "sm:scale-95 translate-y-full"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh]">
              {/* Handle for dragging (mobile only) */}
              <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Close button */}
              <button
                onClick={closeProductDetail}
                className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Product Detail Content */}
              <div className="overflow-y-auto flex-1">
                {/* Product Image */}
                <div className="relative h-64 sm:h-64 bg-gray-100">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Product Info */}
                <div className="p-4 sm:p-6">
                  <div className="mb-4">
                    {/* Category badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-black text-xs rounded-full">
                        {selectedProduct.category_name}
                      </span>
                    </div>
                    <div className="flex items-center  py-1.5 rounded-lg w-fit">
                      <span className="text-md font-semibold text-red-500">
                        {selectedProduct.price} MVR
                      </span>
                      <span className="text-sm text-gray-500 font-normal ml-1">
                        / {selectedProduct.unit}
                      </span>
                    </div>
                    {/* Title and price */}
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-bold text-gray-800">
                        {selectedProduct.title}
                      </h2>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center my-4">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <=
                              Math.round(selectedProduct.average_rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 ml-2">
                        {productRatings.length} reviews
                      </span>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-6">
                      {selectedProduct.stock > 0 ? (
                        <div className="flex items-center text-yellow-700">
                          <svg
                            className="w-5 h-5 mr-1.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {/* <span>
                            In Stock ({selectedProduct.stock} available)
                          </span> */}
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <svg
                            className="w-5 h-5 mr-1.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <h3 className="text-lg font-semibold mb-3">
                        Description
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-600">
                        {selectedProduct.description ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedProduct.description,
                            }}
                          ></div>
                        ) : (
                          <p>No description available for this product.</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity selector */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                      <h3 className="text-lg font-semibold mb-3">Quantity</h3>
                      <div className="flex items-center">
                        <button
                          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            const existingItem = cart.find(
                              (item) => item.product.id === selectedProduct.id
                            );
                            const currentQty = existingItem
                              ? existingItem.quantity
                              : 0;
                            if (currentQty > 0) {
                              updateQuantity(existingItem.id, currentQty - 1);
                            }
                          }}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="mx-4 text-lg font-medium w-8 text-center">
                          {(() => {
                            const existingItem = cart.find(
                              (item) => item.product.id === selectedProduct.id
                            );
                            return existingItem ? existingItem.quantity : 0;
                          })()}
                        </span>
                        <button
                          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            const existingItem = cart.find(
                              (item) => item.product.id === selectedProduct.id
                            );
                            if (existingItem) {
                              updateQuantity(
                                existingItem.id,
                                existingItem.quantity + 1
                              );
                            } else {
                              addToCart(selectedProduct, {
                                currentTarget: document.querySelector(
                                  ".add-to-cart-desktop"
                                ),
                              });
                            }
                          }}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Reviews Section - Simplified for modal view */}
                    {productRatings.length > 0 && (
                      <div className="mt-8 border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">
                            Customer Reviews
                          </h3>
                          {productRatings.length > 2 && (
                            <button className="text-yellow-600 text-sm font-medium hover:text-yellow-700">
                              View all {productRatings.length} reviews
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {productRatings.slice(0, 2).map((rating, index) => (
                            <div
                              key={index}
                              className="border-b border-gray-100 pb-4 last:border-0"
                            >
                              <div className="flex items-center mb-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= rating.rating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(
                                    rating.created
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {rating.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <Button
                  className=" rounded-ful bg-yellow-400 text-black hover:bg-yellow-500 py-3 text-base add-to-cart-desktop"
                  onClick={(e) => {
                    addToCart(selectedProduct, e);
                    // Optional: close the drawer after adding to cart
                    // closeProductDetail();
                  }}
                >
                  Add to Cart - {selectedProduct.price} MVR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-yellow-400 text-black mt-8 sm:mt-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Maldives Eats
              </h3>
              <p className="text-black text-xs sm:text-sm">
                Your one-stop online grocery store for all Maldivian food
                products.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Quick Links
              </h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-black">
                <li>
                  <Link href="/about">About Us</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/faq">FAQ</Link>
                </li>
                <li>
                  <Link href="/terms">Terms & Conditions</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Categories
              </h3>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-black">
                {categories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link href={`/?category=${category.slug}`}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Contact Us
              </h3>
              <p className="text-xs sm:text-sm text-black mb-1 sm:mb-2">
                Email: info@maldiveseats.mv
              </p>
              <p className="text-xs sm:text-sm text-black mb-1 sm:mb-2">
                Phone: +960 777 1234
              </p>
              <div className="flex space-x-4 mt-3 sm:mt-4">
                <a href="#" className="text-black">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="text-black">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-black">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-yellow-600 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-black">
            <p>
              &copy; {new Date().getFullYear()} Maldives Eats. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Animation Styles - Updated with no-scrollbar utility */}
      <style jsx global>{`
        /* Existing animations... */

        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        @keyframes moveToCart {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: scale(0.5)
              translate(
                ${animatingItem
                  ? (animatingItem.endX - animatingItem.startX) / 0.5
                  : 0}px,
                ${animatingItem
                  ? (animatingItem.endY - animatingItem.startY) / 0.5
                  : 0}px
              );
            opacity: 0;
          }
        }

        @keyframes spin {
          0% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            transform: scale(0.8) rotate(360deg);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }

        .cart-pulse {
          animation: pulse 0.7s ease-in-out;
        }

        .add-to-cart-btn {
          transition: transform 0.2s ease;
        }

        .add-to-cart-btn:active {
          transform: scale(0.9);
        }

        /* Improved mobile styling */
        @media (max-width: 640px) {
          .cart-button {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
