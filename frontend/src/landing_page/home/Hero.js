import React from 'react';

function Hero() {
    return ( 
        <div className="container p-5 mb-5">
             <div className="row">
                <div className="col text-center">
                    <img src="media/images/homeHero.png" alt="Hero Image" className="img-fluid mb-4"/>
                    <h1 className="mt-5">Invest in everything</h1>
                    <p>Online platform to invest in stocks, derivatives, mutual funds, ETFs, bonds, and more.</p>
                    <button className="p-2 btn btn-primary fs-5 mb-5" style={{width:"20%", margin:"0 auto"}}>Sign up for free</button>
                </div>
             </div>

        </div>
     );
}

export default Hero;
