// Определяем, нужно ли проверять существование пользователя
let user = null;

// Если userId не anonymous-user, проверяем существование пользователя
if (userId && userId !== 'anonymous-user') {
  user = await User.findById(userId);
  if (!user) {
    console.error('Пользователь не найден:', userId);
    return res.status(404).json({ 
      success: false, 
      message: 'Пользователь не найден' 
    });
  }
} else {
  console.log('Создание анонимного платежа без привязки к пользователю');
} 