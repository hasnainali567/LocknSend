import React from 'react'
import { FaCloudMoon , FaSun } from "react-icons/fa";
import { IoSunnyOutline,IoMoonOutline  } from "react-icons/io5";
import './style.scss'


const ThemeBtn = ({ theme = 'light', themeToggle }) => {
  return (
    <div className='theme-btn p-2 rounded-full text-xl flex text-white cursor-pointer' onClick={themeToggle}>
        {theme === 'dark' ? <FaSun /> : <FaCloudMoon />}
    </div>
  )
}

export default ThemeBtn;