import React from "react";
import Header from "../Header";
import Footer from "../Footer";

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col w-5xl mx-auto pb-10">
        <Header />
        {children}
        <Footer />
    </div>);
};

export default AppLayout;
