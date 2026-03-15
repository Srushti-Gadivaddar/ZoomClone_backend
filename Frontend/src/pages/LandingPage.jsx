import React from "react";
import "../App.css";
import { Link, Router, useNavigate } from "react-router-dom";


function LandingPage() {

    const router = useNavigate();

    return (
        <div className="landing-pageContainer">
           <nav>
                <div className="navHeader">
                    <h2>Apna Video Call</h2>
                </div>
                <div className="navlist">
                    < p onClick={() => {
                        router("home/aljk23");
                    }}>Join as Guest</p>
                    <div onClick={() => {
                        router("/auth");
                    }} role="button">
                        <p onClick={() => {
                        router("/auth");
                    }}>Login</p>
                    </div>
                </div>
           </nav>

           <div className="landing-mainContainer">
                <div>
                    <h1><span style={{color: "#FF9839"}}>Connect</span> With Your Loved Ones</h1>
                    <p>Cover  a distance by apna video call</p>
                    <div role="button">
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="Mobile Preview" />
                </div>
           </div>
        </div>
    );
}


export default LandingPage;