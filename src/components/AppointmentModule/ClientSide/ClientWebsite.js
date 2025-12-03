import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import {
  FaFacebook,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaUserMd,
  FaStethoscope,
  FaDog,
  FaFlask,
  FaSyringe,
  FaHeart,
  FaAward,
  FaShieldAlt,
  FaArrowRight,
  FaProcedures,
  FaUniversity,
  FaUserCog,
  FaServer,
  FaPalette,
  FaLinkedin,
  FaHeadset,
} from "react-icons/fa";
import southpawsLogo from "../../../assets/southpawslogo-header.png";
import southpawsLogoWhite from "../../../assets/southpawslogowhite.png";
import heroBanner from "../../../assets/web-hero-banner.jpg";
import aboutUsImage from "../../../assets/about-us-image.jpg";
import "./ClientSide.css";
import ClientAppointment from "./ClientAppointment";
import StaffPortalModal from "./StaffPortalModal";
import ClientChatbot from "../../Chatbot/ClientChatbot";

function ClientWebsite() {
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionMap = {
        home: homeRef,
        services: servicesRef,
        about: aboutRef,
      };
      const sectionRef = sectionMap[location.state.scrollTo];

      const timer = setTimeout(() => {
        sectionRef?.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        window.history.replaceState({}, document.title);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    if (
      !location.pathname.endsWith("/southpawsvet") &&
      location.pathname !== "/"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".scroll-animate").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const scrollToSection = (sectionRef) => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="client-website">
      <WebsiteHeader
        scrollToSection={scrollToSection}
        homeRef={homeRef}
        servicesRef={servicesRef}
        aboutRef={aboutRef}
      />

      <Routes>
        {/* Home page */}
        <Route
          path=""
          element={
            <>
              <div ref={homeRef} style={{ scrollMarginTop: "80px" }}>
                <HomeSection
                  scrollToSection={scrollToSection}
                  servicesRef={servicesRef}
                />
              </div>
              <div ref={servicesRef} style={{ scrollMarginTop: "70px" }}>
                <ServicesSection />
              </div>
              <div ref={aboutRef} style={{ scrollMarginTop: "70px" }}>
                <AboutSection />
              </div>
              <WebsiteFooter
                scrollToSection={scrollToSection}
                homeRef={homeRef}
                servicesRef={servicesRef}
                aboutRef={aboutRef}
              />
            </>
          }
        />

        {/* Booking page */}
        <Route
          path="booking/*"
          element={
            <>
              <ClientAppointment />
              <WebsiteFooter
                scrollToSection={scrollToSection}
                homeRef={homeRef}
                servicesRef={servicesRef}
                aboutRef={aboutRef}
              />
            </>
          }
        />
      </Routes>

      <StaffPortalModal />

      <DevCreditsModal />

      <ClientChatbot />
    </div>
  );
}

function WebsiteHeader({ homeRef, servicesRef, aboutRef }) {
  const navigate = useNavigate();

  const handleScroll = (sectionName) => {
    const sectionMap = {
      home: homeRef,
      services: servicesRef,
      about: aboutRef,
    };

    if (sectionMap[sectionName]?.current) {
      sectionMap[sectionName].current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      navigate("/southpawsvet", { state: { scrollTo: sectionName } });
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container-fluid px-5">
        <button
          className="navbar-brand d-flex align-items-center border-0 bg-transparent"
          onClick={() => handleScroll("home")}
          style={{ cursor: "pointer" }}
        >
          <img
            src={southpawsLogo}
            alt="South Paws Veterinary Hospital"
            style={{ height: "45px", objectFit: "contain" }}
          />
        </button>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-2">
            <button
              className="nav-link border-0 bg-transparent"
              onClick={() => handleScroll("home")}
            >
              Home
            </button>
            <button
              className="nav-link border-0 bg-transparent"
              onClick={() => handleScroll("services")}
            >
              Services
            </button>
            <button
              className="nav-link border-0 bg-transparent"
              onClick={() => handleScroll("about")}
            >
              About Us
            </button>
            <button
              className="nav-link border-0 bg-transparent d-flex align-items-center gap-1"
              data-bs-toggle="modal"
              data-bs-target="#staffPortalModal"
            >
              Staff Portal
            </button>
            <li className="nav-item ms-2 d-none d-lg-block">
              <NavLink
                to="/southpawsvet/booking"
                className="btn btn-gradient-web"
              >
                Book Appointment
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function HomeSection({ scrollToSection, servicesRef }) {
  const [intro, setIntro] = useState({
    header: "",
    paragraph: "",
    heroImage: "",
  });
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/ClientSide/get_public_content.php`)
      .then((res) => {
        if (res.data.success) {
          setIntro({
            header: res.data.intro_header || "",
            paragraph: res.data.intro_paragraph || "",
            heroImage: res.data.homepage_cover_photo || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="home-page pt-5">
      {/* Hero Section */}
      <section
        className={`hero-section d-flex align-items-center ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        style={{
          transition: "opacity 0.3s ease",
          backgroundImage: `url(${
            intro.heroImage
              ? `${API_BASE_URL}/api/public/${intro.heroImage}`
              : heroBanner
          })`,
          backgroundSize: "cover",
          backgroundPosition: "left center",
          minHeight: "100vh",
          width: "100%",
          color: "#fff",
          position: "relative",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        ></div>

        <div className="container-fluid px-5 position-relative text-start">
          <div className="col-md-6 hero-content animate-hero">
            <h1 className="display-4 fw-bold mb-3">
              {intro.header || "Where Every Pawprint Matters"}
            </h1>
            <p className="lead mb-4">
              {intro.paragraph ||
                "With modern care, personal attention, and genuine love for animals, we make sure every pawprint leads to a healthier, happier story."}
            </p>
            <div className="d-flex gap-3">
              <NavLink
                to="/southpawsvet/booking"
                className="btn btn-light btn-lg"
              >
                Book Appointment
              </NavLink>
              <button
                className="btn btn-outline-light btn-lg"
                onClick={() => scrollToSection(servicesRef)}
                type="button"
              >
                Our Services
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <div className="container-fluid px-5">
          <div className="row text-center mb-5 scroll-animate">
            <div className="col">
              <h2 className="fw-bold display-5 mb-3">Why Choose South Paws?</h2>
              <p className="lead text-muted">
                Personal, dedicated care for your beloved pets
              </p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <div className="feature-card text-center p-4 scroll-animate">
                <div className="feature-icon mb-4">
                  <FaUserMd size={60} className="text-primary" />
                </div>
                <h4 className="fw-bold mb-3">One-on-One Care</h4>
                <p className="text-muted">
                  Your pet receives personalized attention from a dedicated
                  veterinarian who knows their unique needs.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="feature-card text-center p-4 scroll-animate">
                <div className="feature-icon mb-4">
                  <FaHeart size={60} className="text-danger" />
                </div>
                <h4 className="fw-bold mb-3">Compassionate Service</h4>
                <p className="text-muted">
                  We treat every patient like family, ensuring comfort and
                  kindness at each visit.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="feature-card text-center p-4 scroll-animate">
                <div className="feature-icon mb-4">
                  <FaClock size={60} className="text-warning" />
                </div>
                <h4 className="fw-bold mb-3">Flexible Scheduling</h4>
                <p className="text-muted">
                  Convenient appointment times that work with your busy
                  schedule.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="feature-card text-center p-4 scroll-animate">
                <div className="feature-icon mb-4">
                  <FaAward size={60} className="text-success" />
                </div>
                <h4 className="fw-bold mb-3">Trusted by Pet Owners</h4>
                <p className="text-muted">
                  Families in Cebu trust us for our compassion, reliability, and
                  dedication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServicesSection() {
  const services = [
    {
      title: "Preventive Care",
      description:
        "Routine wellness exams to keep your pets healthy and detect issues early.",
      icon: <FaStethoscope size={32} className="text-primary" />,
      features: [
        "Wellness Exams",
        "Pet Care Guidance",
        "Preventive Treatments",
      ],
    },
    {
      title: "Consultations",
      description:
        "Professional veterinary advice and personalized treatment plans.",
      icon: <FaDog size={32} className="text-warning" />,
      features: ["General Check-ups", "Treatment Plans", "Follow-up Visits"],
    },
    {
      title: "Deworming",
      description:
        "Safe and effective parasite prevention for your furry friends.",
      icon: <FaShieldAlt size={32} className="text-success" />,
      features: ["Internal Parasites", "Preventive Care", "Regular Scheduling"],
    },
    {
      title: "Vaccinations",
      description:
        "Protect your pets from common diseases with scheduled vaccines.",
      icon: <FaSyringe size={32} className="text-info" />,
      features: ["Core Vaccines", "Optional Vaccines", "Pet-Specific Plans"],
    },
    {
      title: "Laboratory Tests",
      description:
        "Basic diagnostics including CBC, urinalysis, fecal exams, and more.",
      icon: <FaFlask size={32} className="text-danger" />,
      features: ["CBC", "Urinalysis", "Fecalysis"],
    },
    {
      title: "Treatment & Procedures",
      description:
        "Comprehensive care including wound treatments and minor procedures for your pets.",
      icon: <FaProcedures size={32} className="text-purple" />,
      features: ["Wound Cleaning", "Minor Procedures", "Special Treatments"],
    },
  ];

  return (
    <section className="services-section py-5">
      <div className="container-fluid px-5">
        <div className="row text-center mb-5 scroll-animate">
          <div className="col">
            <h2 className="fw-bold display-5 mb-3 text-white">
              Our Veterinary Services
            </h2>
            <p className="lead text-light opacity-75">
              Comprehensive care for your beloved companions
            </p>
          </div>
        </div>
        <div className="row g-4">
          {services.map((service, index) => (
            <div className="col-lg-4 col-md-6" key={index}>
              <div className="service-card h-100 border-0 p-4 scroll-animate">
                <div className="service-icon mb-3">{service.icon}</div>
                <h4 className="fw-bold mb-3 text-dark">{service.title}</h4>
                <p className="text-dark opacity-75 mb-4">
                  {service.description}
                </p>
                <ul className="service-features list-unstyled">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="mb-2 text-dark">
                      <FaArrowRight size={12} className="text-primary me-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const [aboutData, setAboutData] = useState({
    mission: "",
    vision: "",
    background_photo: "",
    about_paragraph: "",
    values: [],
  });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/ClientSide/get_public_content.php`)
      .then((res) => {
        if (res.data.success) {
          setAboutData({
            mission: res.data.mission,
            vision: res.data.vision,
            background_photo: res.data.background_photo,
            about_paragraph: res.data.about_paragraph,
            values: res.data.values ? res.data.values.split("|") : [],
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section className="about-section py-5 bg-light">
      <div className="container-fluid px-5">
        <div className="row align-items-start g-5">
          <div className="col-lg-6 scroll-animate">
            <div className="about-image position-relative">
              <img
                src={
                  aboutData.background_photo
                    ? `${API_BASE_URL}/api/public/${aboutData.background_photo}`
                    : aboutUsImage
                }
                alt="About Us"
                className="img-fluid rounded shadow-lg"
              />
            </div>
          </div>
          <div className="col-lg-6 scroll-animate">
            <h2 className="fw-bold display-5 mb-4">About Us</h2>
            <p className="lead mb-4">{aboutData.about_paragraph}</p>

            <div className="mission-values mb-4">
              <h4 className="fw-bold mb-3">Our Mission</h4>
              <div className="d-flex align-items-center mb-3">
                <span>
                  {aboutData.mission || "Loading mission statement..."}
                </span>
              </div>

              <h4 className="fw-bold mb-3">Our Vision</h4>
              <div className="d-flex align-items-center mb-3">
                {aboutData.vision || "Loading vision statement..."}
              </div>

              <h4 className="fw-bold mb-3">Our Values</h4>
              <div className="row">
                {aboutData.values.map((val, i) => (
                  <div className="col-md-6 mb-3" key={i}>
                    <div className="d-flex align-items-center">
                      <FaArrowRight className="text-primary me-3" />
                      <span>{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WebsiteFooter({ homeRef, servicesRef, aboutRef }) {
  const navigate = useNavigate();
  const [footer, setFooter] = useState({
    description: "",
    address: "",
    mapLink: "",
    number: "",
    fbLink: "",
    fbText: "",
    weekdays: "",
    hours: "",
  });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/ClientSide/get_public_content.php`)
      .then((res) => {
        if (res.data.success) {
          setFooter({
            description: res.data.footer_description,
            address: res.data.footer_address,
            mapLink: res.data.footer_map_link,
            number: res.data.footer_number,
            fbLink: res.data.footer_fb_link,
            fbText: res.data.footer_fb_text,
            weekdays: res.data.footer_weekdays,
            hours: res.data.footer_hours,
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleScroll = (sectionName) => {
    const sectionMap = {
      home: homeRef,
      services: servicesRef,
      about: aboutRef,
    };

    if (sectionMap[sectionName]?.current) {
      sectionMap[sectionName].current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      navigate("/southpawsvet", { state: { scrollTo: sectionName } });
    }
  };

  return (
    <footer className="bg-dark text-white py-5">
      <div className="container-fluid px-5">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <h5 className="d-flex align-items-center gap-2 mb-3">
              <img
                src={southpawsLogoWhite}
                alt="South Paws"
                style={{ height: "40px" }}
              />
              South Paws Veterinary Hospital
            </h5>
            <p className="text-light">{footer.description}</p>
          </div>

          <div className="col-lg-2 mb-4">
            <h6 className="mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <button
                  onClick={() => handleScroll("home")}
                  className="footer-link text-light text-decoration-none border-0 bg-transparent"
                >
                  Home
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => handleScroll("services")}
                  className="footer-link text-light text-decoration-none border-0 bg-transparent"
                >
                  Services
                </button>
              </li>
              <li className="mb-2">
                <button
                  onClick={() => handleScroll("about")}
                  className="footer-link text-light text-decoration-none border-0 bg-transparent"
                >
                  About Us
                </button>
              </li>
              <li className="mb-2">
                <NavLink
                  to="/southpawsvet/booking"
                  className="footer-link text-light text-decoration-none"
                >
                  Book Appointment
                </NavLink>
              </li>
              <li className="mb-2">
                <button
                  className="footer-link text-light text-decoration-none border-0 bg-transparent"
                  data-bs-toggle="modal"
                  data-bs-target="#staffPortalModal"
                >
                  Staff Portal
                </button>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 mb-4">
            <h6 className="mb-3">Contact Info</h6>
            <div className="d-flex align-items-center mb-3">
              <FaMapMarkerAlt className="me-3 text-primary" />
              <a
                href={footer.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link text-light text-decoration-none"
              >
                {footer.address}
              </a>
            </div>
            <div className="d-flex align-items-center mb-3">
              <FaPhoneAlt className="me-3 text-primary" />
              <span>{footer.number}</span>
            </div>
            <div className="d-flex align-items-center mb-3">
              <FaFacebook className="me-3 text-primary" />
              <a
                href={footer.fbLink}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link text-light text-decoration-none"
              >
                South Paws Veterinary Hospital
              </a>
            </div>
          </div>

          <div className="col-lg-3 mb-4">
            <h6 className="mb-3">Business Hours</h6>
            <div className="text-light">
              <div className="d-flex justify-content-between mb-2">
                <span>{footer.weekdays}</span>
                <span>{footer.hours}</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-4" />

         {/* Credit Section */}
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <small>
              &copy; {new Date().getFullYear()} South Paws Veterinary Hospital.
              All rights reserved.
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <small className="text-light opacity-75">
              <button
                className="btn btn-link text-primary text-decoration-none p-0 border-0 bg-transparent"
                data-bs-toggle="modal"
                data-bs-target="#devCreditsModal"
              >
                Contact Developers
              </button>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DevCreditsModal() {
  return (
    <div 
      className="modal fade" 
      id="devCreditsModal" 
      tabIndex="-1" 
      aria-labelledby="devCreditsModalLabel" 
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-body p-4">
            <div className="text-center mb-4">
              <div className="text-center mb-4">
                <h4 className="fw-bold mb-2">Get in Touch</h4>
                <p className="text-muted mb-0">
                  For technical inquiries, collaboration, or feedback, feel free to connect with our team members below.
                </p>
              </div>
            </div>
            
            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm hover-lift transition-all">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                        <FaUserCog className="text-primary" size={36} />
                      </div>
                    </div>
                    <h6 className="fw-bold mb-2">Romnick Herschel</h6>
                    <p className="text-muted small mb-2">Lead Developer</p>
                    <a 
                      href="https://www.linkedin.com/in/romnick-leon-herschel-677036295/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm"
                      title="Connect with Romnick on LinkedIn"
                    >
                      <FaLinkedin className="me-2" />
                      Connect
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm hover-lift transition-all">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                        <FaServer className="text-success" size={36} />
                      </div>
                    </div>
                    <h6 className="fw-bold mb-2">Rexer Anoos</h6>
                    <p className="text-muted small mb-2">Backend Developer</p>
                    <a 
                      href="https://www.linkedin.com/in/rexer-john-anoos-76346328b/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-success btn-sm"
                      title="Connect with Rexer on LinkedIn"
                    >
                      <FaLinkedin className="me-2" />
                      Connect
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm hover-lift transition-all">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center p-3">
                        <FaPalette className="text-info" size={36} />
                      </div>
                    </div>
                    <h6 className="fw-bold mb-2">Jovie Teofilo</h6>
                    <p className="text-muted small mb-2">UI/UX Designer</p>
                    <a 
                      href="https://www.linkedin.com/in/jovie-anne-suzette-teofilo-49b5722a4/"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-info btn-sm"
                      title="Connect with Jovie on LinkedIn"
                    >
                      <FaLinkedin className="me-2" />
                      Connect
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer border-top-0">
            <button 
              type="button" 
              className="btn btn-outline-secondary px-4"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientWebsite;
