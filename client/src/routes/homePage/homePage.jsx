import { useContext } from "react";
import SearchBar from "../../components/searchBar/SearchBar";
import "./homePage.scss";
import { AuthContext } from "../../context/AuthContext";

function HomePage() {

  const {currentUser} = useContext(AuthContext)

  return (
    <div className="homePage">
      <div className="textContainer">
        <div className="wrapper">
          <h1 className="title">Find Real Estate & Get Your Dream Place</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos
            explicabo suscipit cum eius, iure est nulla animi consequatur
            facilis id pariatur fugit quos laudantium temporibus dolor ea
            repellat provident impedit!
          </p>
          <SearchBar />
          <div className="boxes">
            <div className="box">
              <h1>1+</h1>
              <h2>Year of Experience</h2>
            </div>
            <div className="box">
              <h1>00</h1>
              <h2>Award Gained</h2>
            </div>
            <div className="box">
              <h1>20+</h1>
              <h2>Property Ready</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
