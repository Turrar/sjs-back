import { BadRequestException } from '@nestjs/common';
import { ApplicationStatus } from '../enums/application-status.enum';
import {
  assertEmployerStatusTransition,
  assertStudentWithdraw,
} from './application-status.util';

describe('assertEmployerStatusTransition', () => {
  it('allows SUBMITTED -> REVIEWING', () => {
    expect(() =>
      assertEmployerStatusTransition(
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.REVIEWING,
      ),
    ).not.toThrow();
  });

  it('blocks employer setting WITHDRAWN', () => {
    expect(() =>
      assertEmployerStatusTransition(
        ApplicationStatus.REVIEWING,
        ApplicationStatus.WITHDRAWN,
      ),
    ).toThrow(BadRequestException);
  });

  it('blocks SUBMITTED -> HIRED', () => {
    expect(() =>
      assertEmployerStatusTransition(
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.HIRED,
      ),
    ).toThrow(BadRequestException);
  });

  it('allows INTERVIEW -> OFFER', () => {
    expect(() =>
      assertEmployerStatusTransition(
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.OFFER,
      ),
    ).not.toThrow();
  });

  it('blocks changes from REJECTED', () => {
    expect(() =>
      assertEmployerStatusTransition(
        ApplicationStatus.REJECTED,
        ApplicationStatus.REVIEWING,
      ),
    ).toThrow(BadRequestException);
  });
});

describe('assertStudentWithdraw', () => {
  it('allows SUBMITTED', () => {
    expect(() => assertStudentWithdraw(ApplicationStatus.SUBMITTED)).not.toThrow();
  });

  it('allows INTERVIEW', () => {
    expect(() => assertStudentWithdraw(ApplicationStatus.INTERVIEW)).not.toThrow();
  });

  it('blocks OFFER', () => {
    expect(() => assertStudentWithdraw(ApplicationStatus.OFFER)).toThrow(
      BadRequestException,
    );
  });

  it('blocks HIRED', () => {
    expect(() => assertStudentWithdraw(ApplicationStatus.HIRED)).toThrow(
      BadRequestException,
    );
  });

  it('blocks WITHDRAWN', () => {
    expect(() => assertStudentWithdraw(ApplicationStatus.WITHDRAWN)).toThrow(
      BadRequestException,
    );
  });
});
