import '../../domain/entities/user_entity.dart';

class AuthRepositoryImpl {
  Future<UserEntity> login({required String email, required String password}) async {
    return UserEntity(id: 0, email: email, fullName: '');
  }
}