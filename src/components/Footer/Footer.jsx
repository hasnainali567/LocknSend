import React from "react";
import "./style.scss";
import { FaFacebookSquare, FaTwitter  } from "react-icons/fa";

const Footer = () => {
  return <div className="footer text-center flex flex-col justify-center items-center">
    <p className="w-58 mb-10 text-md text-gray-400 font-light"  >© 2011-2025 AirForShare.com Made in BirdsCorp.com with ❤️</p>
    <div className="flex gap-10">
        <FaFacebookSquare size={35} />
        <FaTwitter size={35}/>
    </div>
  </div>;
};

export default Footer;
