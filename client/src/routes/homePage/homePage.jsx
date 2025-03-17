/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import SearchBar from "../../components/searchBar/SearchBar";
import "./homePage.scss";
import { AuthContext } from "../../context/AuthContext";

function HomePage() {
  const { currentUser } = useContext(AuthContext);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 50;
  const deletingSpeed = 30;
  const pauseTime = 1500;
  
  // Features list
  const features = [
    "Explore a curated selection of choice-based properties.",
    "Instantly connect with sellers via our in-app chat.",
    "Conveniently schedule property visits.",
    "Ditch the middlemen and experience transparency.",
    "Find your perfect apna ghar with ease."
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentFeature = features[currentFeatureIndex];
      
      if (!isDeleting) {
        // Typing phase
        setDisplayText(currentFeature.substring(0, displayText.length + 1));
        
        // If we've completed typing the current feature
        if (displayText.length === currentFeature.length) {
          // Pause before starting to delete
          setTimeout(() => setIsDeleting(true), pauseTime);
          return;
        }
      } else {
        // Deleting phase
        setDisplayText(currentFeature.substring(0, displayText.length - 1));
        
        // If we've completely deleted the feature
        if (displayText.length === 0) {
          setIsDeleting(false);
          // Move to next feature (or back to first)
          setCurrentFeatureIndex((currentFeatureIndex + 1) % features.length);
          return;
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);
    
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentFeatureIndex, features]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="homePage">
      <motion.div 
        className="textContainer"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="wrapper">
          <motion.h1 
            className="title"
            variants={itemVariants}
          >
            Find Real Estate & Get Your Dream Place
          </motion.h1>
          
          <motion.p variants={itemVariants}>
            <p>Apna Ghar - Your Direct Path to Homeownership.</p>
          </motion.p>
          
          <motion.p variants={itemVariants}>
            Tired of brokerage fees? <strong>Apna Ghar</strong> empowers you to find your ideal home directly from owners.
          </motion.p>
          
          <motion.div 
            className="featuresContainer"
            variants={itemVariants}
          >
            <div className="featureTitle">Why Choose Us?</div>
            <div className="typingContainer">
              <span className="typingText">{displayText}</span>
              <span className="cursor"></span>
            </div>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
          >
            <SearchBar />
          </motion.div>
          
          <motion.div 
            className="boxes"
            variants={containerVariants}
          >
            <motion.div 
              className="box"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h1>1+</h1>
              <h2>Year of Experience</h2>
            </motion.div>
            <motion.div 
              className="box"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h1>00</h1>
              <h2>Award Gained</h2>
            </motion.div>
            <motion.div 
              className="box"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h1>20+</h1>
              <h2>Property Ready</h2>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default HomePage;