import axios from 'axios';

export const checkKarmaBlacklist = async (email: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${process.env.ADJUTOR_BASE_URL}/verification/karma/${email}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ADJUTOR_API_KEY}`,
        },
      }
    );
    return response.data?.data !== null;
  } catch (error: any) {
    if (error.response?.status === 404) return false;
    throw new Error('Karma check failed');
  }
};