// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const Summary = () => {
//   const [summaryData, setSummaryData] = useState({});
//   const [holdingsCount, setHoldingsCount] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Fetch summary data
//     const fetchSummary = async () => {
//       try {
//         const summaryResponse = await axios.get("http://localhost:3002/api/summary", {
//   headers: {
//     "Content-Type": "application/json"
//   },
//   withCredentials: false
// });
//         setSummaryData(summaryResponse.data);

//        const holdingsResponse = await axios.get("http://localhost:3002/api/allHoldings", {
//   headers: {
//     "Content-Type": "application/json"
//   },
//   withCredentials: false
// });
//         setHoldingsCount(holdingsResponse.data.length);

//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching summary data:", error);
//       }
//     };

//     fetchSummary();
//   }, []);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <>
//       <div className="username">
//         <h6>Hi, {summaryData.username || "User"}!</h6>
//         <hr className="divider" />
//       </div>

//       <div className="section">
//         <span>
//           <p>Equity</p>
//         </span>

//         <div className="data">
//           <div className="first">
//             <h3>{summaryData.marginAvailable || 0}k</h3>
//             <p>Margin available</p>
//           </div>
//           <hr />

//           <div className="second">
//             <p>
//               Margins used <span>{summaryData.marginsUsed || 0}k</span>
//             </p>
//             <p>
//               Opening balance <span>{summaryData.openingBalance || 0}k</span>
//             </p>
//           </div>
//         </div>
//         <hr className="divider" />
//       </div>

//       <div className="section">
//         <span>
//           <p>Holdings ({holdingsCount})</p>
//         </span>

//         <div className="data">
//           <div className="first">
//             <h3 className="profit">
//               {summaryData.profitLoss || 0}k <small>+{summaryData.profitPercentage || 0}%</small>
//             </h3>
//             <p>P&L</p>
//           </div>
//           <hr />

//           <div className="second">
//             <p>
//               Current Value <span>{summaryData.currentValue || 0}k</span>
//             </p>
//             <p>
//               Investment <span>{summaryData.investment || 0}k</span>
//             </p>
//           </div>
//         </div>
//         <hr className="divider" />
//       </div>
//     </>
//   );
// };

// export default Summary;


import React, { useState, useEffect } from "react";
import axios from "axios";

const Summary = () => {
  const [summaryData, setSummaryData] = useState({});
  const [holdingsCount, setHoldingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summaryResponse = await axios.get("http://localhost:3002/api/summary", {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: false, // set to false if no cookies/auth needed
        });

        console.log("📦 Summary response data:", summaryResponse.data);
        setSummaryData(summaryResponse.data);

        const holdingsResponse = await axios.get("http://localhost:3002/api/allHoldings", {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: false,
        });

        console.log("📦 Holdings response data:", holdingsResponse.data);
        setHoldingsCount(holdingsResponse.data.length);

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching summary or holdings data:", error);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="username">
        <h6>Hi, {summaryData.username || "User"}!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>{summaryData.marginAvailable || 0}k</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Margins used <span>{summaryData.marginsUsed || 0}k</span>
            </p>
            <p>
              Opening balance <span>{summaryData.openingBalance || 0}k</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({holdingsCount})</p>
        </span>

        <div className="data">
          <div className="first">
            <h3 className="profit">
              {summaryData.profitLoss || 0}k{" "}
              <small>+{summaryData.profitPercentage || 0}%</small>
            </h3>
            <p>P&L</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Current Value <span>{summaryData.currentValue || 0}k</span>
            </p>
            <p>
              Investment <span>{summaryData.investment || 0}k</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;
