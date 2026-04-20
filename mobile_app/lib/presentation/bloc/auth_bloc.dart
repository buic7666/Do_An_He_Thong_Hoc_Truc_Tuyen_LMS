import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/usecases/login_usecase.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc()
      : _loginUseCase = LoginUseCase(AuthRepositoryImpl()),
        super(const AuthState()) {
    on<LoginRequested>(_onLoginRequested);
  }

  final LoginUseCase _loginUseCase;

  Future<void> _onLoginRequested(LoginRequested event, Emitter<AuthState> emit) async {
    emit(state.copyWith(isLoading: true, errorMessage: null));

    try {
      await _loginUseCase.execute(email: event.email, password: event.password);
      emit(state.copyWith(isLoading: false));
    } catch (_error) {
      emit(state.copyWith(isLoading: false, errorMessage: 'Login failed'));
    }
  }
}