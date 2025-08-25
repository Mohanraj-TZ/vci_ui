import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../api";
import "../../assets/css/Componentstock.css";

const SkeletonCard = () => (
  <div className="five-col mb-3">
    <div className="d-flex">
      <div
        className="bg-light rounded me-2 mt-1"
        style={{ width: 50, height: 50 }}
      ></div>
      <div
        className="d-flex flex-column justify-content-center"
        style={{ width: "100px" }}
      >
        <div
          className="bg-light rounded mb-1"
          style={{ height: "12px", width: "70%" }}
        ></div>
        <div
          className="bg-light rounded mb-1"
          style={{ height: "16px", width: "50%" }}
        ></div>
        <div
          className="bg-light rounded"
          style={{ height: "10px", width: "60%" }}
        ></div>
      </div>
    </div>
  </div>
);

const DamagedSpareparts = () => {
  const [damagedData, setDamagedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasDamages, setHasDamages] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/damaged-spareparts-count`)
      .then((res) => {
        if (res.data?.success && res.data?.data?.length > 0) {
          setDamagedData(res.data.data);

          const hasAnyDamage = res.data.data.some((d) => d.damaged_count > 0);
          setHasDamages(hasAnyDamage);
        } else {
          setDamagedData([]);
          setHasDamages(false);
        }
      })
      .catch(() => {
        setDamagedData([]);
        setHasDamages(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card p-3 border-0 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h5 className="fw-semibold mb-1">Damaged Spare Parts</h5>
          <small className="text-muted d-block">Damage report</small>
        </div>

        {hasDamages && (
          <div
            className="d-flex align-items-center"
            style={{ maxWidth: "350px", textAlign: "right" }}
          >
            <FaBell className="me-2" style={{ color: "#dc3545" }} />
            <small
              className="fw-semibold"
              style={{ lineHeight: "1.2", color: "#dc3545" }}
            >
              Some spare parts are damaged!
            </small>
          </div>
        )}
      </div>

      <div className="stock-scroll-wrapper mt-3">
        <div className="d-flex flex-wrap scroll-container">
          {loading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          ) : damagedData.length > 0 ? (
            damagedData.map((item, index) => (
              <div key={index} className="five-col mb-3">
                <div className="d-flex">
                  <div
                    className="bg-light rounded me-2 mt-1"
                    style={{ width: 50, height: 50 }}
                  ></div>

                  <div className="d-flex flex-column justify-content-center">
                    <small className="custom-small-text">{item.name}</small>
                    <div className="fw-bold fs-5 text-danger">
                      {item.damaged_count} Damaged
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center w-100 py-4">
              <img
                src="/empty-box.png"
                alt="No damages"
                style={{ width: "80px", height: "100px", opacity: 0.6 }}
              />
              <div className="text-muted mt-2">No damaged spare parts</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DamagedSpareparts;
