import React, {useEffect, useRef, useState} from "react";
import "./style.scss";
const TextArea = ({value , onChangeText}) => {
    const textAreaRef = useRef();
    const resizeTextArea = (event) =>{
        textAreaRef.current.style.height = '100px';
        textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 12 + 'px';
    } 

    useEffect(()=>{
        resizeTextArea()
    }, [value])

  return <textarea ref={textAreaRef} value={value}  onInput={(e)=> {onChangeText(e.target.value)}} name=''className="text-area" placeholder="Type Something here..."></textarea>;
};

export default TextArea;
