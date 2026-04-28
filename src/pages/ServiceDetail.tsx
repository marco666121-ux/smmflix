import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Index from "./Index";

/**
 * Deep-link route /service/:id — stores the requested ID in sessionStorage
 * and renders the main Index page, which picks it up on mount.
 */
const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      sessionStorage.setItem("smmflix.preselectServiceId", id);
    }
    // Replace the URL with "/" so refresh stays predictable but keep state.
    navigate("/", { replace: true });
  }, [id, navigate]);

  return <Index />;
};

export default ServiceDetail;
