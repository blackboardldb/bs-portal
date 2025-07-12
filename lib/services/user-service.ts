import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { User, CreateUser, UpdateUser } from "@/lib/schemas";

export class UserService {
  private store = useBlackSheepStore.getState();

  async getUsers(): Promise<User[]> {
    return this.store.users;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.store.users.find((user) => user.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.store.users.find((user) => user.email === email) || null;
  }

  async createUser(userData: CreateUser): Promise<User> {
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      emergencyContact: userData.emergencyContact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.store.addUser(newUser);
    return newUser;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User | null> {
    const user = this.store.users.find((u) => u.id === id);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    this.store.updateUser(updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.store.users.find((u) => u.id === id);
    if (!user) return false;

    this.store.deleteUser(id);
    return true;
  }

  async getUsersWithMembership(): Promise<User[]> {
    return this.store.users.filter((user) => user.membership);
  }

  async getActiveUsers(): Promise<User[]> {
    return this.store.users.filter(
      (user) => user.membership?.status === "active"
    );
  }

  async getUsersByMembershipStatus(status: string): Promise<User[]> {
    return this.store.users.filter(
      (user) => user.membership?.status === status
    );
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return this.store.users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(lowerQuery) ||
        user.lastName.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const userService = new UserService();
