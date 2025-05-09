import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * @route GET /api/user/count
 * @desc Get the number of registered users and their profile images
 * @access Public
 */
export async function GET() {
  try {
    // Connect to the database
    const db = await connectToDB();

    // Get the collection
    const usersCollection = db.collection("users");

    // Count the total number of users
    const totalUsers = await usersCollection.countDocuments();

    // Get user profile images (limit to 5 for performance)
    const users = await usersCollection
      .find({ image: { $exists: true, $ne: null } })
      .limit(5)
      .project({ image: 1, name: 1 })
      .toArray();

    // Extract profile images
    const profileImages = users.map((user) => ({
      src: user.image,
      alt: user.name || "User",
    }));

    return NextResponse.json({
      success: true,
      totalUsers,
      profileImages,
    });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user count" },
      { status: 500 }
    );
  }
}
