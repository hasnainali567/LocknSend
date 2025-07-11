import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { ThemeProvider } from "../../context/ThemeContext.jsx";
import { SavingProvider } from "../../context/SavingContext.jsx";

const AppLayout = ({ children }) => {
  return (
    <ThemeProvider>
      <SavingProvider>
        <div className='flex flex-col w-5xl mx-auto p-5 py-0 pb-10'>
          <Header />
          {children}
          <Footer />
        </div>
      </SavingProvider>
    </ThemeProvider>
  );
};

export default AppLayout;
