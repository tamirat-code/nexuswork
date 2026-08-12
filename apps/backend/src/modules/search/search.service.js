import Project from "../projects/projects.model.js";
import StudentProfile from "../students/students.model.js";
import University from "../universities/universities.model.js";
import User from "../users/users.model.js";


export async function searchAll({ q, type = "projects", limit = 20, skip = 0 }) {
  const searchTerm = q?.trim();
  const lim = Number(limit) || 20;
  const skp = Number(skip) || 0;

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
      const match = {};
      if (searchTerm) {
        const userIds = await User.find({ name: { $regex: searchTerm, $options: "i" } }).select("_id").lean();
        match.user_id = { $in: userIds.map((u) => u._id) };
      }
      const [results, total] = await Promise.all([
        StudentProfile.find(match)
          .populate("user_id", "name email")
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
          { name: { $regex: searchTerm, $options: "i" } },
          { domain: { $regex: searchTerm, $options: "i" } },
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