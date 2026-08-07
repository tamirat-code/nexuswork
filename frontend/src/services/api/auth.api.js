import { apiFetch } from "../../lib/http";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const mockUsers = [
  {
    id: "1",
    name: "Test Student",
    email: "student@test.com",
    password: "123456",
    role: "student",
    status: "active",
  },
  {
    id: "2",
    name: "Test Client",
    email: "client@test.com",
    password: "123456",
    role: "client",
    status: "active",
  },
  {
    id: "3",
    name: "Test University Staff",
    email: "university@test.com",
    password: "123456",
    role: "university_staff",
    status: "active",
  },
  {
    id: "4",
    name: "Test Admin",
    email: "admin@test.com",
    password: "123456",
    role: "admin",
    status: "active",
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginUser({ email, password }) {
  if (USE_MOCK) {
    await delay(600);

    const user = mockUsers.find(
      (item) => item.email === email && item.password === password,
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const { ...safeUser } = user;

    return {
      success: true,
      message: "Login successful",
      data: {
        user: safeUser,
        token: `mock-token-${safeUser.role}`,
      },
    };
  }

  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser({ name, email, password, role }) {
  if (USE_MOCK) {
    await delay(800);

    const existingUser = mockUsers.find((user) => user.email === email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const newUser = {
      id: `mock-${Date.now()}`,
      name,
      email,
      role,
      status: "active",
    };

    return {
      success: true,
      message: "Registration successful",
      data: {
        user: newUser,
        token: `mock-token-${newUser.role}`,
      },
    };
  }

  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
}
