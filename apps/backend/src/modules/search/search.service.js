import Project from "../projects/projects.model.js";
import StudentProfile from "../students/students.model.js";
import University from "../universities/universities.model.js";
import User from "../users/users.model.js";

const MAX_LIMIT = 100;
const MAX_SKIP = 100000;

function pagination(limit, skip) {
  const parsedLimit = Number(limit);
  const parsedSkip = Number(skip);
  return {
    limit: Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.trunc(parsedLimit), 1), MAX_LIMIT) : 20,
    skip: Number.isFinite(parsedSkip) ? Math.min(Math.max(Math.trunc(parsedSkip), 0), MAX_SKIP) : 0,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchAll({ q, type = "projects", limit = 20, skip = 0 }) {
  const searchTerm = typeof q === "string" ? q.trim().slice(0, 200) : "";
  const safeSearchTerm = escapeRegex(searchTerm);
  const { limit: lim, skip: skp } = pagination(limit, skip);

  switch (type) {
    case "projects": {
      const match = { status: "open" };
      if (searchTerm) match.$text = { $search: searchTerm };

      const [results, total] = await Promise.all([
        Project.aggregate([
          { $match: match },
          {
            $lookup: {
              from: "users",
              localField: "client_id",
              foreignField: "_id",
              as: "_client",
            },
          },
          { $unwind: { path: "$_client", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              client_id: {
                _id: "$_client._id",
                name: "$_client.name",
              },
            },
          },
          { $project: { _client: 0 } },
          { $skip: skp },
          { $limit: lim },
        ]),
        Project.countDocuments(match),
      ]);
      return { results, total };
    }

    case "students": {
      const userQuery = { role: "student", status: "active" };
      if (searchTerm) userQuery.name = { $regex: safeSearchTerm, $options: "i" };
      const userIds = await User.find(userQuery).select("_id").lean();
      const match = { user_id: { $in: userIds.map((u) => u._id) } };
      const [results, total] = await Promise.all([
        StudentProfile.find(match)
          .populate("user_id", "name avatarUrl headline bio location university skills website universityVerified")
          .populate("university_id", "name")
          .skip(skp)
          .limit(lim)
          .lean(),
        StudentProfile.countDocuments(match),
      ]);
      return { results, total };
    }

    case "universities": {
      const match = {};
      if (searchTerm) {
        match.$or = [
          { name: { $regex: safeSearchTerm, $options: "i" } },
          { domain: { $regex: safeSearchTerm, $options: "i" } },
        ];
      }
      const [results, total] = await Promise.all([
        University.find(match).skip(skp).limit(lim).lean(),
        University.countDocuments(match),
      ]);
      return { results, total };
    }

    default:
      return { results: [], total: 0 };
  }
}
