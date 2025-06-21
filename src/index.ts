console.log('Hello from TypeScript!');

// Example of TypeScript features
interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log(`User ${user.name} added successfully!`);
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }
}

// Example usage
const userService = new UserService();

const newUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
};

userService.addUser(newUser);
console.log('All users:', userService.getAllUsers());

export { User, UserService }; 