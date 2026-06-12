const { TeacherProfile, User } = require('../models');
const { HttpError } = require('../utils/httpError');

const getOrCreateProfile = async (teacherId) => {
  let profile = await TeacherProfile.findOne({ where: { teacherId } });

  if (!profile) {
    const teacher = await User.findByPk(teacherId);

    if (!teacher) {
      throw new HttpError(404, 'Teacher not found', 'USER_NOT_FOUND');
    }

    profile = await TeacherProfile.create({
      teacherId,
      title: 'Giang vien',
      bio: '',
      linkedin: '',
      facebook: '',
      bankName: '',
      bankAccount: '',
      bankOwner: (teacher.name || '').toUpperCase(),
    });
  }

  return profile;
};

const getProfile = async (currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const teacher = await User.findByPk(currentUser.id);

  if (!teacher) {
    throw new HttpError(404, 'Teacher not found', 'USER_NOT_FOUND');
  }

  const profile = await getOrCreateProfile(currentUser.id);

  const userPlain = teacher.toJSON();
  const profilePlain = profile.toJSON();

  return {
    fullName: userPlain.name,
    email: userPlain.email,
    title: profilePlain.title || '',
    bio: profilePlain.bio || '',
    linkedin: profilePlain.linkedin || '',
    facebook: profilePlain.facebook || '',
    bankName: profilePlain.bankName || '',
    bankAccount: profilePlain.bankAccount || '',
    bankOwner: profilePlain.bankOwner || '',
  };
};

const updateProfile = async (payload, currentUser) => {
  if (!currentUser?.id) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const teacher = await User.findByPk(currentUser.id);

  if (!teacher) {
    throw new HttpError(404, 'Teacher not found', 'USER_NOT_FOUND');
  }

  const profile = await getOrCreateProfile(currentUser.id);

  if (payload.fullName) {
    teacher.name = payload.fullName;
    await teacher.save();
  }

  profile.title = payload.title ?? profile.title;
  profile.bio = payload.bio ?? profile.bio;
  profile.linkedin = payload.linkedin ?? profile.linkedin;
  profile.facebook = payload.facebook ?? profile.facebook;
  profile.bankName = payload.bankName ?? profile.bankName;
  profile.bankAccount = payload.bankAccount ?? profile.bankAccount;
  profile.bankOwner = payload.bankOwner ?? profile.bankOwner;

  await profile.save();

  return getProfile(currentUser);
};

module.exports = {
  getProfile,
  updateProfile,
};
