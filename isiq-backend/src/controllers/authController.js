const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');

// Token yarat
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
  return { accessToken, refreshToken };
};

// @POST /api/v1/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, age, gender, interestedIn, city, location, height, weight, birthDate } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu email artıq istifadə edilir' });
    }

    const user = await User.create({
      name, email, password, age, gender, interestedIn, city, location, height, weight, birthDate,
      isVerified: true,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Qeydiyyat uğurlu oldu',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        city: user.city,
        height: user.height,
        weight: user.weight,
        birthDate: user.birthDate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email və şifrə tələb olunur' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email və ya şifrə yanlışdır' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email və ya şifrə yanlışdır' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Giriş uğurlu oldu',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        city: user.city,
        isPremium: user.isPremium,
        photos: user.photos,
        height: user.height,
        weight: user.weight,
        birthDate: user.birthDate,
        bio: user.bio,
        job: user.job,
        education: user.education,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/auth/google
const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, photo } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ success: false, message: 'Google məlumatları tələb olunur' });
    }

    let user = await User.findOne({ email });

    if (user) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      user.refreshToken = refreshToken;
      user.lastSeen = Date.now();
      if (photo && !user.photos.length) {
        user.photos = [photo];
      }
      await user.save({ validateBeforeSave: false });

      return res.json({
        success: true,
        message: 'Giriş uğurlu oldu',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          gender: user.gender,
          city: user.city,
          isPremium: user.isPremium,
          photos: user.photos,
          height: user.height,
          weight: user.weight,
          birthDate: user.birthDate,
        },
      });
    }

    user = await User.create({
      name,
      email,
      password: googleId + process.env.JWT_SECRET,
      age: 18,
      gender: 'kişi',
      interestedIn: ['qadın'],
      city: 'Bakı',
      photos: photo ? [photo] : [],
      isVerified: true,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Qeydiyyat uğurlu oldu',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        city: user.city,
        isPremium: user.isPremium,
        photos: user.photos,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/auth/verify
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select('+verificationCode +verificationCodeExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email artıq təsdiqlənib' });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Kod yanlışdır' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Kodun müddəti bitib' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Email təsdiqləndi!',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        city: user.city,
        height: user.height,
        weight: user.weight,
        birthDate: user.birthDate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/auth/resend
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+verificationCode +verificationCodeExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email artıq təsdiqlənib' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(email, code);
      console.log('Yeni kod göndərildi:', email);
    } catch (emailError) {
      console.log('Email xətası:', emailError.message);
    }

    res.json({ success: true, message: 'Yeni kod göndərildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token tələb olunur' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Token etibarsızdır' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token etibarsızdır' });
  }
};

// @POST /api/v1/auth/logout
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = null;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Çıxış uğurlu oldu' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/v1/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, googleAuth, verifyEmail, resendVerification, refresh, logout, getMe };