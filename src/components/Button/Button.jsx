import React from 'react';
import './style.scss'

const Button = ({ onClick, children = "Save", type = "button", disable }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disable}
      className='btn border-2 px-22 py-3.5 text-2xl font-bold italic cursor-pointer'
    >
      {children}
    </button>
  );
};

export default Button;
