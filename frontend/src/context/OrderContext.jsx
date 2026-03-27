import { createContext, useContext, useState, useCallback } from 'react';
import orderService from '../services/orderService';
import otpService from '../services/otpService';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const createOrder = useCallback(async (productId) => {
    const response = await orderService.create({ product_id: productId });
    const newOrder = response.data;
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const acceptOrder = useCallback(async (orderId) => {
    const response = await orderService.updateStatus(orderId, 'CONFIRMED');
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, order_status: 'CONFIRMED' }
          : order
      )
    );
    return response.data;
  }, []);

  const generateOrderOTP = useCallback(async (orderId) => {
    const response = await otpService.generate(orderId);
    return response.data;
  }, []);

  const verifyOTP = useCallback(async (orderId, enteredOTP) => {
    const response = await otpService.verify(orderId, enteredOTP);
    if (response.data.verified) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, order_status: 'COMPLETED', completed_at: new Date().toISOString() }
            : o
        )
      );
    }
    return response.data;
  }, []);

  const cancelOrder = useCallback(async (orderId) => {
    const response = await orderService.updateStatus(orderId, 'CANCELLED');
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, order_status: 'CANCELLED' }
          : order
      )
    );
    return response.data;
  }, []);

  const getOrdersByBuyer = useCallback(async () => {
    const response = await orderService.getByBuyer();
    setOrders(response.data);
    return response.data;
  }, []);

  const getOrdersBySeller = useCallback(async () => {
    const response = await orderService.getBySeller();
    return response.data;
  }, []);

  const getOrderById = useCallback(async (orderId) => {
    const response = await orderService.getById(orderId);
    return response.data;
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        acceptOrder,
        generateOrderOTP,
        verifyOTP,
        cancelOrder,
        getOrdersByBuyer,
        getOrdersBySeller,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

export default OrderContext;
