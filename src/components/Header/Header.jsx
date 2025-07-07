import React, { useState } from "react";
import LOGO from '../../assets/Logo.png'
import "./style.scss";
import { Link } from "react-router-dom";
import ThemeBtn from "../Theme";

const Header = () => {
  const [theme, setTheme] = useState('light');
  const themeToggle = () => {
    if (theme === 'light') {
      setTheme('dark')
      window.document.body.classList.add('dark')
    } else {
      setTheme('light')
      window.document.body.classList.remove('dark')
    }
  }
  return (
    <div className='header w-full'>
      <div className="img-conatiner">
        <Link to={'/'}><img className="logo-img" src={LOGO} /></Link>
      </div>
      <div className="list-container">
        <ul>
            <li>
                <Link to={'/how-it-works'}>How it Works / Precuations</Link>
            </li>
            <li>
                <Link to={'/feedback'}>Feedback</Link>
            </li>
            <li>
              <ThemeBtn theme={theme} themeToggle={themeToggle} />
            </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
