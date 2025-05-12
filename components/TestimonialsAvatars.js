"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Fallback avatars falls keine Benutzerbilder verfügbar sind
const fallbackAvatars = [
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3276&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1488161628813-04466f872be2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3376&q=80",
  },
];

const TestimonialsAvatars = ({ priority = false }) => {
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/count");

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();

        if (data.success) {
          setUsersData({
            totalUsers: data.totalUsers,
            profileImages:
              data.profileImages.length > 0
                ? data.profileImages
                : fallbackAvatars,
          });
        } else {
          throw new Error(data.error || "Failed to fetch user data");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-3">
        <div className="flex -space-x-5 avatar-group justify-start">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="avatar w-12 h-12">
              <div className="w-12 h-12 rounded-full bg-base-300 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center items-center">
          <div className="w-24 h-5 bg-base-300 animate-pulse rounded mb-2" />
          <div className="w-48 h-5 bg-base-300 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !usersData) {
    return null;
  }

  // Maximal 5 Bilder anzeigen
  const displayAvatars = usersData.profileImages.slice(0, 5);

  return (
    <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-3">
      <div className={`-space-x-5 avatar-group justify-start`}>
        {displayAvatars.map((image, i) => (
          <div className="avatar w-12 h-12" key={i}>
            <Image
              src={image.src}
              alt={image.alt}
              priority={priority}
              width={50}
              height={50}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-center items-center">
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-yellow-500"
              key={i}
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                clipRule="evenodd"
              />
            </svg>
          ))}
        </div>

        <div className="text-base text-base-content/80">
          <span className="font-semibold text-base-content">
            {usersData.totalUsers}
          </span>{" "}
          Bitcoiners save on fees already
        </div>
      </div>
    </div>
  );
};

export default TestimonialsAvatars;
