'use client'
import { useState } from "react";

// Load environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend_ip";

interface Employee {
  ifhrms_id: string;
  name: string;
  designation?: string;
  phone_number?: string;
  is_approved: boolean;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    designation: "",
    phone_number: "",
  });
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [approvalSearch, setApprovalSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [currentApprovalPage, setCurrentApprovalPage] = useState(1);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const itemsPerPage = 10;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username === "aiwc-admin" && password === "aiwcrte@2025") {
      setIsAuthenticated(true);
      fetchPendingApprovals();
      fetchAllEmployees();
    } else {
      alert("Invalid credentials");
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/users`);
      if (!response.ok) throw new Error("Failed to fetch pending approvals");
      const data = await response.json();
      setPendingApprovals(data.filter((user: Employee) => !user.is_approved));
    } catch (error) {
      setError("Error fetching pending approvals. Please try again later.");
      console.error(error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/users`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data.filter((user: Employee) => user.is_approved));
    } catch (error) {
      setError("Error fetching employees. Please try again later.");
      console.error(error);
    }
  };

  const handleApprove = async (ifhrms_id: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ifhrms_id }),
      });
      if (!response.ok) throw new Error("Failed to approve user");
      fetchPendingApprovals();
      fetchAllEmployees();
    } catch (error) {
      setError("Error approving user. Please try again later.");
      console.error(error);
    }
  };

  const handleReject = async (ifhrms_id: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ifhrms_id }),
      });
      if (!response.ok) throw new Error("Failed to reject user");
      fetchPendingApprovals();
    } catch (error) {
      setError("Error rejecting user. Please try again later.");
      console.error(error);
    }
  };

  const handleApproveAll = async () => {
    try {
      for (const user of pendingApprovals) {
        await handleApprove(user.ifhrms_id);
      }
    } catch (error) {
      setError("Error approving all users. Please try again later.");
      console.error(error);
    }
  };

  const handleRejectAll = async () => {
    try {
      for (const user of pendingApprovals) {
        await handleReject(user.ifhrms_id);
      }
    } catch (error) {
      setError("Error rejecting all users. Please try again later.");
      console.error(error);
    }
  };

  const startEditing = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name || "",
      designation: employee.designation || "",
      phone_number: employee.phone_number || "",
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const response = await fetch(`${BACKEND_URL}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ifhrms_id: editingEmployee.ifhrms_id,
          ...editForm
        }),
      });
      if (!response.ok) throw new Error("Failed to update employee");
      fetchAllEmployees();
      setEditingEmployee(null);
    } catch (error) {
      setError("Error updating employee. Please try again later.");
      console.error(error);
    }
  };

  // Filter and search functions
  const filteredPendingApprovals = pendingApprovals.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(approvalSearch.toLowerCase()) ||
      user.ifhrms_id.toLowerCase().includes(approvalSearch.toLowerCase()) ||
      (user.designation && user.designation.toLowerCase().includes(approvalSearch.toLowerCase()));
    
    if (approvalFilter === "all") return matchesSearch;
    if (approvalFilter === "designation" && user.designation) return matchesSearch;
    if (approvalFilter === "no-designation" && !user.designation) return matchesSearch;
    
    return false;
  });

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      employee.ifhrms_id.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (employee.designation && employee.designation.toLowerCase().includes(employeeSearch.toLowerCase())) ||
      (employee.phone_number && employee.phone_number.includes(employeeSearch));
    
    if (employeeFilter === "all") return matchesSearch;
    if (employeeFilter === "designation" && employee.designation) return matchesSearch;
    if (employeeFilter === "no-designation" && !employee.designation) return matchesSearch;
    
    return false;
  });

  // Pagination
  const indexOfLastApproval = currentApprovalPage * itemsPerPage;
  const indexOfFirstApproval = indexOfLastApproval - itemsPerPage;
  const currentApprovals = filteredPendingApprovals.slice(indexOfFirstApproval, indexOfLastApproval);
  
  const indexOfLastEmployee = currentEmployeePage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  
  const totalApprovalPages = Math.ceil(filteredPendingApprovals.length / itemsPerPage);
  const totalEmployeePages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const paginate = (pageNumber: number, section: 'approval' | 'employee') => {
    if (section === 'approval') {
      setCurrentApprovalPage(pageNumber);
    } else {
      setCurrentEmployeePage(pageNumber);
    }
  };

  // Generate pagination numbers with ellipsis
  const getPaginationNumbers = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 4) {
      return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    
    if (currentPage >= totalPages - 3) {
      return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, 2, 3, '...', currentPage, '...', totalPages - 2, totalPages - 1, totalPages];
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}
      {!isAuthenticated ? (
        <div className="flex h-screen">
          {/* Left side - Green gradient with logo */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-400 to-green-700 justify-center items-center relative">
            <div className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20" 
                 style={{backgroundImage: "url('https://www.aiwc.res.in/assets/images/emb.png')"}}></div>
            <div className="z-10 text-white text-center p-8">
              <h1 className="text-3xl font-bold mb-4">AIWC Admin Portal</h1>
              <p className="text-xl">Forest Department Management System</p>
            </div>
          </div>
          
          {/* Right side - Login form */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Login</h1>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 mt-4"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className=" mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          </header>
          
          {editingEmployee ? (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Edit Employee: {editingEmployee.name}</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={editForm.designation}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={editForm.phone_number}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex space-x-4">
                  <button 
                    type="submit"
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left side - All Employees */}
              <section className="bg-white p-6 rounded-lg shadow-md md:w-1/2">
                <h2 className="text-xl font-semibold mb-4">All Employees ({filteredEmployees.length})</h2>
                
                <div className="flex flex-col gap-4 mb-4">
                  <div className="w-full">
                    <input
                      type="text"
                      placeholder="Search by name, ID, designation, or phone..."
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setCurrentEmployeePage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="w-full">
                    <select
                      value={employeeFilter}
                      onChange={(e) => {
                        setEmployeeFilter(e.target.value);
                        setCurrentEmployeePage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Employees</option>
                      <option value="designation">With Designation</option>
                      <option value="no-designation">Without Designation</option>
                    </select>
                  </div>
                </div>
                
                {filteredEmployees.length === 0 ? (
                  <p className="text-gray-500">No employees match your criteria</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentEmployees.map((employee) => (
                            <tr key={employee.ifhrms_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.ifhrms_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.designation || "-"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.phone_number || "-"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                  onClick={() => startEditing(employee)}
                                  className="text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 p-1 rounded"
                                  title="Edit employee"
                                >
                                  ✏️ Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination for Employees */}
                    {totalEmployeePages > 1 && (
                      <div className="flex justify-center mt-4">
                        <nav className="flex items-center">
                          <button
                            onClick={() => paginate(Math.max(1, currentEmployeePage - 1), 'employee')}
                            disabled={currentEmployeePage === 1}
                            className="px-3 py-1 rounded-md mr-2 bg-gray-200 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <div className="flex space-x-1">
                            {getPaginationNumbers(currentEmployeePage, totalEmployeePages).map((number, index) => (
                              <button
                                key={index}
                                onClick={() => typeof number === 'number' ? paginate(number, 'employee') : null}
                                disabled={number === '...'}
                                className={`px-3 py-1 rounded-md ${
                                  currentEmployeePage === number ? 'bg-blue-500 text-white' : 
                                  number === '...' ? 'bg-gray-100 cursor-default' : 'bg-gray-200'
                                }`}
                              >
                                {number}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => paginate(Math.min(totalEmployeePages, currentEmployeePage + 1), 'employee')}
                            disabled={currentEmployeePage === totalEmployeePages}
                            className="px-3 py-1 rounded-md ml-2 bg-gray-200 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </section>
              
              {/* Right side - Pending Approvals */}
              <section className="bg-white p-6 rounded-lg shadow-md md:w-1/2">
                <div className="flex flex-col justify-between mb-6">
                  <h2 className="text-xl font-semibold mb-2">Pending Approvals ({filteredPendingApprovals.length})</h2>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={handleApproveAll}
                      className="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 text-sm"
                      disabled={pendingApprovals.length === 0}
                    >
                      Approve All
                    </button>
                    <button 
                      onClick={handleRejectAll}
                      className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700 text-sm"
                      disabled={pendingApprovals.length === 0}
                    >
                      Reject All
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 mb-4">
                  <div className="w-full">
                    <input
                      type="text"
                      placeholder="Search by name, ID, or designation..."
                      value={approvalSearch}
                      onChange={(e) => {
                        setApprovalSearch(e.target.value);
                        setCurrentApprovalPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="w-full">
                    <select
                      value={approvalFilter}
                      onChange={(e) => {
                        setApprovalFilter(e.target.value);
                        setCurrentApprovalPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Requests</option>
                      <option value="designation">With Designation</option>
                      <option value="no-designation">Without Designation</option>
                    </select>
                  </div>
                </div>
                
                {filteredPendingApprovals.length === 0 ? (
                  <p className="text-gray-500">No pending approvals match your criteria</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentApprovals.map((user) => (
                            <tr key={user.ifhrms_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.ifhrms_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.designation || "-"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleApprove(user.ifhrms_id)}
                                    className="bg-green-100 text-green-800 py-1 px-3 rounded-md hover:bg-green-200"
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleReject(user.ifhrms_id)}
                                    className="bg-red-100 text-red-800 py-1 px-3 rounded-md hover:bg-red-200"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination for Approvals */}
                    {totalApprovalPages > 1 && (
                      <div className="flex justify-center mt-4">
                        <nav className="flex items-center">
                          <button
                            onClick={() => paginate(Math.max(1, currentApprovalPage - 1), 'approval')}
                            disabled={currentApprovalPage === 1}
                            className="px-3 py-1 rounded-md mr-2 bg-gray-200 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <div className="flex space-x-1">
                            {getPaginationNumbers(currentApprovalPage, totalApprovalPages).map((number, index) => (
                              <button
                                key={index}
                                onClick={() => typeof number === 'number' ? paginate(number, 'approval') : null}
                                disabled={number === '...'}
                                className={`px-3 py-1 rounded-md ${
                                  currentApprovalPage === number ? 'bg-blue-500 text-white' : 
                                  number === '...' ? 'bg-gray-100 cursor-default' : 'bg-gray-200'
                                }`}
                              >
                                {number}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => paginate(Math.min(totalApprovalPages, currentApprovalPage + 1), 'approval')}
                            disabled={currentApprovalPage === totalApprovalPages}
                            className="px-3 py-1 rounded-md ml-2 bg-gray-200 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 