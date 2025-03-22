"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingCartIcon,
  ArrowLeftIcon,
  TrashIcon,
} from "@/components/ui/icons";

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    // Load cart from session storage
    const sessionCart = sessionStorage.getItem("cart");
    if (sessionCart) {
      setCart(JSON.parse(sessionCart));
    }
  }, []);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeItem = (itemId) => {
    const updatedCart = cart.filter((item) => item.id !== itemId);
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const calculateSubtotal = (item) => {
    return (parseFloat(item.price) * item.quantity).toFixed(2);
  };

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => {
        return total + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!name || !phone) {
      alert("Please provide your name and phone number");
      return;
    }

    setLoading(true);

    try {
      // Calculate total amount
      const totalAmount = calculateTotal();

      // Generate a session ID if not already present
      const sessionId =
        sessionStorage.getItem("sessionId") ||
        Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

      // Save session ID for future orders
      sessionStorage.setItem("sessionId", sessionId);

      // Prepare order data with all necessary fields
      const orderData = {
        name,
        email,
        phone,
        address,
        total_price: totalAmount,
        session_id: sessionId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      // Place the order
      const result = await placeOrder(orderData);

      // Store the order in session storage for the dashboard
      const newOrder = {
        id: result.id,
        name,
        email,
        phone,
        address,
        total_price: totalAmount,
        status: "pending",
        created: new Date().toISOString(),
        items: cart.map((item) => ({
          product: {
            id: item.product.id,
            title: item.product.title,
          },
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // Get existing placed orders or initialize empty array
      const existingOrders = JSON.parse(
        sessionStorage.getItem("placedOrders") || "[]"
      );
      existingOrders.push(newOrder);
      sessionStorage.setItem("placedOrders", JSON.stringify(existingOrders));

      // Clear cart after successful order
      sessionStorage.removeItem("cart");
      setOrderSuccess(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("There was an error submitting your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Order placement function
  async function placeOrder(orderData) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order");
      }

      return await response.json();
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  }

  const goBack = () => {
    router.push("/");
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Order Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order, {name}. We'll contact you at {phone} with
            delivery details.
          </p>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={goBack}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Your Cart</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <ShoppingCartIcon className="w-16 h-16 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={goBack}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">
                    Shopping Cart ({cart.length} items)
                  </h2>
                </div>

                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 flex">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center mr-4">
                        <img
                          src={`${item.product.image}`}
                          alt={item.product.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="flex-grow">
                        <h3 className="font-medium">{item.product.title}</h3>
                        <p className="text-sm text-gray-500">
                          {item.price} MVR / {item.product.unit}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded-md">
                            <button
                              className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </button>
                            <span className="px-2 py-1">{item.quantity}</span>
                            <button
                              className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center">
                            <span className="font-medium mr-4">
                              {calculateSubtotal(item)} MVR
                            </span>
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeItem(item.id)}
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{calculateTotal()} MVR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{calculateTotal()} MVR</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your phone number"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Your delivery address"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
