import { useState, useEffect } from "react";
import "./agentsPage.scss";

const AgentsPage = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const agents = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Luxury Property Specialist",
      image: "/agents/sarah.jpg",
      experience: "8+ years",
      specialization: "Luxury Homes",
      languages: ["English", "French", "Spanish"],
      awards: ["Top Agent 2024", "Luxury Specialist"],
      rating: 4.9,
      reviews: 127,
      properties: 45,
      deals: "200M+",
      email: "sarah.j@estate.com",
      phone: "+1 (555) 123-4567",
      bio: "Sarah specializes in luxury properties and has a proven track record of closing high-value deals. Her multilingual abilities and deep understanding of the luxury market make her the go-to agent for discerning clients.",
      socialMedia: {
        linkedin: "linkedin.com/sarahj",
        instagram: "instagram.com/sarahj_luxury",
        twitter: "twitter.com/sarahj_estate"
      }
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Commercial Real Estate Expert",
      image: "/agents/michael.jpg",
      experience: "12+ years",
      specialization: "Commercial Properties",
      languages: ["English", "Mandarin", "Cantonese"],
      awards: ["Commercial Expert 2023", "Business Choice Award"],
      rating: 4.8,
      reviews: 98,
      properties: 62,
      deals: "350M+",
      email: "michael.c@estate.com",
      phone: "+1 (555) 234-5678",
      bio: "Michael's expertise in commercial real estate and international business makes him an invaluable asset for investors and businesses looking to expand their property portfolio.",
      socialMedia: {
        linkedin: "linkedin.com/michaelc",
        instagram: "instagram.com/michaelc_commercial",
        twitter: "twitter.com/michaelc_estate"
      }
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Residential Property Expert",
      image: "/agents/emma.jpg",
      experience: "6+ years",
      specialization: "Family Homes",
      languages: ["English", "Spanish"],
      awards: ["Rising Star 2023", "Customer Choice"],
      rating: 4.9,
      reviews: 156,
      properties: 38,
      deals: "150M+",
      email: "emma.r@estate.com",
      phone: "+1 (555) 345-6789",
      bio: "Emma's passion for helping families find their perfect home, combined with her excellent communication skills, has made her one of our most successful residential property agents.",
      socialMedia: {
        linkedin: "linkedin.com/emmar",
        instagram: "instagram.com/emmar_homes",
        twitter: "twitter.com/emmar_estate"
      }
    }
  ];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || agent.specialization.toLowerCase().includes(filter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="agentsPage">
      <div className="agents-hero">
        <div className="hero-content">
          <h1>Meet Our Expert Agents</h1>
          <p>Work with the best real estate professionals in the industry</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search agents by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="search-icon">🔍</i>
          </div>
          <div className="filter-buttons">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All Agents
            </button>
            <button
              className={filter === "luxury" ? "active" : ""}
              onClick={() => setFilter("luxury")}
            >
              Luxury
            </button>
            <button
              className={filter === "commercial" ? "active" : ""}
              onClick={() => setFilter("commercial")}
            >
              Commercial
            </button>
            <button
              className={filter === "residential" ? "active" : ""}
              onClick={() => setFilter("residential")}
            >
              Residential
            </button>
          </div>
        </div>
      </div>

      <div className="agents-grid">
        {filteredAgents.map(agent => (
          <div 
            key={agent.id} 
            className={`agent-card ${selectedAgent === agent.id ? 'expanded' : ''}`}
            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
          >
            <div className="card-header">
              <div className="agent-image">
                <img src={agent.image} alt={agent.name} />
                <div className="agent-badges">
                  {agent.awards.map((award, index) => (
                    <span key={index} className="badge">
                      {award}
                    </span>
                  ))}
                </div>
              </div>
              <div className="agent-info">
                <h3>{agent.name}</h3>
                <h4>{agent.role}</h4>
                <div className="agent-rating">
                  <span className="stars">{"★".repeat(Math.floor(agent.rating))}</span>
                  <span className="rating-number">{agent.rating}</span>
                  <span className="reviews">({agent.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="card-stats">
              <div className="stat">
                <span className="value">{agent.experience}</span>
                <span className="label">Experience</span>
              </div>
              <div className="stat">
                <span className="value">{agent.properties}</span>
                <span className="label">Properties</span>
              </div>
              <div className="stat">
                <span className="value">{agent.deals}</span>
                <span className="label">Deals</span>
              </div>
            </div>

            <div className="card-details">
              <div className="languages">
                <h5>Languages</h5>
                <div className="language-tags">
                  {agent.languages.map((lang, index) => (
                    <span key={index} className="tag">{lang}</span>
                  ))}
                </div>
              </div>
              
              <div className="bio">
                <h5>About</h5>
                <p>{agent.bio}</p>
              </div>

              <div className="contact-info">
                <a href={`mailto:${agent.email}`} className="contact-button email">
                  <i className="icon">✉</i>
                  Email Agent
                </a>
                <a href={`tel:${agent.phone}`} className="contact-button phone">
                  <i className="icon">📞</i>
                  Call Agent
                </a>
              </div>

              <div className="social-links">
                {Object.entries(agent.socialMedia).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={`/social/${platform}.png`} alt={platform} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="join-team">
        <div className="join-content">
          <h2>Join Our Team</h2>
          <p>Are you a real estate professional looking to take your career to the next level?</p>
          <button onClick={() => window.location.href = '/careers'}>
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
