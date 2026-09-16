import React from "react";
import { Navigate } from "react-router-dom";

const MerchantOrdersPage = () => {
  return <Navigate to="/merchant-dashboard?view=orders" replace />;
};

export default MerchantOrdersPage;
