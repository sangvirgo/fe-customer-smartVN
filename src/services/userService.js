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
      phoneNumber,
    })
    return response.data
  },

  getAddresses: async () => {
    const response = await axiosInstance.get("/users/address")
    return response.data
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
