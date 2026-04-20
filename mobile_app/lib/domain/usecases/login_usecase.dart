import '../../data/repositories/auth_repository_impl.dart';
import '../entities/user_entity.dart';

class LoginUseCase {
  LoginUseCase(this._authRepository);

  final AuthRepositoryImpl _authRepository;

  Future<UserEntity> execute({required String email, required String password}) {
    return _authRepository.login(email: email, password: password);
  }
}