import axiosInstance from "./axios"

const userService = {
  getProfile: async () => {
    const response = await axiosInstance.get("/users/profile")
    return response.data
  },

  updateProfile: async (firstName, lastName, phoneNumber) => {
    const response = await axiosInstance.put("/users/profile/update", {
      firstName,
      lastName,
      mobile: phoneNumber,
    })
    return response.data
  },

    getAddresses: async () => {
    const response = await axiosInstance.get("/users/address")
    // Backend trả về array trực tiếp, KHÔNG có wrapper { data: [...] }
    return { data: response.data } // Wrap lại để consistent
    },

  addAddress: async (addressData) => {
    const response = await axiosInstance.post("/users/addresses", addressData)
    return response.data
  },

  updateAddress: async (addressId, addressData) => {
    const response = await axiosInstance.put(`/users/addresses/${addressId}`, addressData)
    return response.data
  },

  deleteAddress: async (addressId) => {
    const response = await axiosInstance.delete(`/users/addresses/${addressId}`)
    return response.data
  },
}

export default userService
