import React from "react";
import LOGO from '../../assets/logo.svg'
import "./style.scss";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className='header w-full'>
      <div className="img-conatiner">
        <Link to={'/'}><img className="logo-img" src={LOGO} /></Link>
      </div>
      <div className="list-container">
        <ul>
            <li>
                <Link to={'/how-it-works'}>How it Works</Link>
            </li>
            <li>
                <Link to={'/download'}>Download</Link>
                
            </li>
            <li>
                <Link to={'/Upgrade'}>Upgrade</Link>
                
            </li>
            <li>
                <Link to={'/feedback'}>Feedback</Link>
                
            </li>
            <li>
                <Link to={'/login-register'}>Login/Register</Link>
                
            </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
