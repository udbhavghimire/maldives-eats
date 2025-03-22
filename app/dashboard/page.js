"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Get session ID for filtering orders
      const sessionId = sessionStorage.getItem("sessionId");

      // Fetch orders from backend API
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/orders/`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      if (data.length > 0) {
        setOrders(data);
        setSelectedOrder(data[0]);
      } else {
        setOrders([]);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setStatusUpdating(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const updatedStatus = await response.json();

      // Update orders list with new status
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );

      setOrders(updatedOrders);

      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
      return false;
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm) ||
      order.id?.toString().includes(searchTerm)
  );

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const goBack = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={goBack}
              className="mr-4 p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Order Dashboard</h1>
          </div>
          <div className="w-64">
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h2 className="text-xl font-bold mb-2">Error Loading Orders</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={goBack}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Return to Home
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <h2 className="text-xl font-bold mb-2">No Orders Found</h2>
                  <p className="text-gray-600 mb-4">
                    There are no orders to display. Place an order to see it
                    here.
                  </p>
                  <Button
                    onClick={goBack}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Go Shopping
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className={`cursor-pointer ${
                            selectedOrder && selectedOrder.id === order.id
                              ? "bg-green-50"
                              : ""
                          }`}
                          onClick={() => handleOrderClick(order)}
                        >
                          <TableCell className="font-medium">
                            #{order.id}
                          </TableCell>
                          <TableCell>
                            <div>{order.name}</div>
                            <div className="text-sm text-gray-500">
                              {order.phone}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(order.created)}</TableCell>
                          <TableCell>{order.total_price} MVR</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "shipped"
                                  ? "bg-purple-100 text-purple-800"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              defaultValue={order.status}
                              onValueChange={(value) =>
                                updateOrderStatus(order.id, value)
                              }
                              disabled={statusUpdating}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">
                                  Processing
                                </SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
                {selectedOrder ? (
                  <>
                    <h2 className="font-semibold text-lg mb-4">
                      Order #{selectedOrder.id}
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Customer Information
                        </h3>
                        <div className="mt-1">
                          <p className="font-medium">{selectedOrder.name}</p>
                          <p>{selectedOrder.email}</p>
                          <p>{selectedOrder.phone}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Delivery Address
                        </h3>
                        <p className="mt-1 whitespace-pre-line">
                          {selectedOrder.address || "No address provided"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Order Items
                        </h3>
                        <div className="mt-2 space-y-2">
                          {selectedOrder.items?.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center border-b pb-2"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.product_title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.quantity} x {item.price} MVR
                                </p>
                              </div>
                              <p className="font-medium">
                                {item.get_total_price} MVR
                              </p>
                            </div>
                          )) || (
                            <p className="text-gray-500">No items available</p>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Total</span>
                          <span className="font-bold">
                            {selectedOrder.total_price} MVR
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 flex space-x-2">
                        <Button
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "delivered")
                          }
                          disabled={
                            statusUpdating ||
                            selectedOrder.status === "delivered"
                          }
                        >
                          Mark as Delivered
                        </Button>
                        <Button
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "cancelled")
                          }
                          disabled={
                            statusUpdating ||
                            selectedOrder.status === "cancelled"
                          }
                        >
                          Cancel Order
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {orders.length > 0
                        ? "Select an order to view details"
                        : "No orders available"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
