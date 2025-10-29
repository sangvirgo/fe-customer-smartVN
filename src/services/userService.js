import axiosInstance from "./axios";

const userService = {
  getProfile: async () => {
    try {
      const response = await axiosInstance.get("/users/profile");
      // Backend trả về ApiResponse<UserDTO>
      return response.data.data; // Trả về UserDTO
    } catch (error) {
       console.error("Error fetching user profile:", error);
       throw error;
    }
  },

  updateProfile: async (firstName, lastName, phoneNumber) => {
     try {
       // Backend dùng 'phoneNumber' trong request body
       const response = await axiosInstance.put("/users/profile/update", {
         firstName,
         lastName,
         phoneNumber, // Sửa 'mobile' thành 'phoneNumber' cho khớp request DTO
       });
       // Backend trả về ApiResponse<UserDTO>
       return response.data; // Trả về { data: UserDTO, message: "..." }
     } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
     }
  },

  getAddresses: async () => {
    try {
      const response = await axiosInstance.get("/users/address");
      // Backend trả về trực tiếp List<AddressDTO>
      return response.data; // Trả về List<AddressDTO>
    } catch (error) {
      console.error("Error fetching addresses:", error);
      throw error;
    }
  },

  addAddress: async (addressData) => {
    // addressData nên có dạng: { fullName, phoneNumber, province, ward, street, note }
    try {
      const response = await axiosInstance.post("/users/addresses", addressData);
      // Backend trả về Map { message: "..." }
      return response.data;
    } catch (error) {
        console.error("Error adding address:", error);
        throw error;
    }
  },

  /**
   * Xóa mềm địa chỉ (soft delete)
   * @param {number} addressId - ID của địa chỉ cần xóa
   * @returns {Promise<{data: null, message: string}>}
   */
  deleteAddress: async (addressId) => {
    if (!addressId) {
      throw new Error("Address ID is required.");
    }
    try {
      const response = await axiosInstance.delete(`/users/addresses/${addressId}`);
      // Backend trả về ApiResponse<Void>: { data: null, message: "Địa chỉ đã được xóa thành công" }
      return response.data;
    } catch (error) {
      console.error(`Error deleting address ${addressId}:`, error);
      throw error;
    }
  },
  
};

export default userService;