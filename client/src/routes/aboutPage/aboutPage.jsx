import { useEffect, useRef, useState } from "react";
import "./aboutPage.scss";

const AboutPage = () => {
  const [activeValue, setActiveValue] = useState(0);
  const timelineRefs = useRef([]);
  const statsRef = useRef(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  const companyValues = [
    {
      icon: "🏠",
      title: "Excellence in Service",
      description:
        "We are committed to providing exceptional service that exceeds expectations. Our team of professionals works tirelessly to ensure every client receives personalized attention and expert guidance throughout their real estate journey."
    },
    {
      icon: "🤝",
      title: "Integrity & Trust",
      description:
        "Trust is the foundation of our business. We maintain the highest standards of integrity in all our dealings, ensuring transparency and honesty in every transaction."
    },
    {
      icon: "🎯",
      title: "Innovation",
      description:
        "We embrace cutting-edge technology and innovative solutions to provide our clients with the best possible real estate experience. Our modern approach keeps us ahead in the dynamic real estate market."
    },
    {
      icon: "💪",
      title: "Empowerment",
      description:
        "We believe in empowering our clients with knowledge and resources to make informed decisions. Our team stays up-to-date with market trends to provide valuable insights."
    }
  ];

  const timeline = [
    {
      year: "2010",
      title: "Company Founded",
      description: "Started with a vision to revolutionize the real estate industry"
    },
    {
      year: "2015",
      title: "National Expansion",
      description: "Expanded operations to major cities across the country"
    },
    {
      year: "2018",
      title: "Digital Innovation",
      description: "Launched cutting-edge digital platform for property transactions"
    },
    {
      year: "2020",
      title: "International Presence",
      description: "Established international partnerships and global reach"
    },
    {
      year: "2024",
      title: "Industry Leader",
      description: "Recognized as one of the top real estate companies nationwide"
    }
  ];

  const stats = [
    { value: "15+", label: "Years of Excellence" },
    { value: "10K+", label: "Properties Sold" },
    { value: "50K+", label: "Happy Clients" },
    { value: "100+", label: "Expert Agents" }
  ];

  const team = [
    {
      name: "Prabhu Pathak",
      position: "CEO & Founder",
      image: "/prabhu.jpeg",
      quote: "Building dreams, one home at a time.",
      linkedin: "https://www.linkedin.com/in/prabhu-ji/"
    },
    {
      name: "Harsh Diwase",
      position: "Head of Operations",
      image: "/harsh.jpeg",
      quote: "Excellence is not an act, but a habit.",
      linkedin: "https://www.linkedin.com/in/harsh-diwase-54a964226/"
    },
    {
      name: "Ujjawal Pathak",
      position: "Chief Technology Officer",
      image: "/ujjwal.jpeg",
      quote: "Innovating the future of real estate.",
      linkedin: "https://www.linkedin.com/in/ujjwalpathaak/"
    }
  ];

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    };

    const statsObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsStatsVisible(true);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.3,
    });

    const statsObserver = new IntersectionObserver(statsObserverCallback, {
      threshold: 0.5,
    });

    timelineRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    if (statsRef.current) {
      statsObserver.observe(statsRef.current);
    }

    return () => {
      observer.disconnect();
      statsObserver.disconnect();
    };
  }, []);

  const handleContactClick = () => {
    window.location.href = '/contact';
  };

  const handleLinkedInClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="aboutPage">
      <div className="hero-section">
        <div className="hero-content">
          <h1>About ApnaGhar</h1>
          <p>Building Trust Through Excellence in Real Estate</p>
        </div>
      </div>

      <section className="mission-section">
        <div className="container">
          <h2>Our Mission</h2>
          <p>
            At ApnaGhar, we're committed to transforming the real estate
            experience through innovation, integrity, and exceptional service. Our
            mission is to help people find their perfect properties while making
            the process seamless and enjoyable.
          </p>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            {companyValues.map((value, index) => (
              <div
                className={`value-card ${activeValue === index ? "active" : ""}`}
                key={index}
                onMouseEnter={() => setActiveValue(index)}
              >
                <div className="icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="team-section">
        <div className="container">
          <h2>Leadership Team</h2>
          <div className="team-grid">
            {team.map((member, index) => (
              <div className="team-card" key={index}>
                <div 
                  className="image-container"
                  onClick={() => handleLinkedInClick(member.linkedin)}
                >
                  <img src={member.image} alt={member.name} />
                </div>
                <h3>{member.name}</h3>
                <h4>{member.position}</h4>
                <p className="quote">"{member.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Join Our Journey</h2>
          <p>
            Whether you are looking to buy, sell, or join our team, we're here to
            help you achieve your real estate goals.
          </p>
          <div className="cta-buttons">
            <button onClick={handleContactClick}>
              Contact Us
            </button>
            <button onClick={() => window.location.href = '/about'} className="secondary">
              Learn More About Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;